"""Bitrefill client — buys gift cards via x402 (OWS pay) or REST API fallback."""
import json
import subprocess
import asyncio
import httpx
from config import OWS_WALLET_NAME, BITREFILL_API_TOKEN

# x402 endpoint for Bitrefill
BITREFILL_X402_BASE = "https://api.bitrefill.com/x402"

# REST API fallback
BITREFILL_REST_BASE = "https://api.bitrefill.com/v2"


class BitrefillClient:
    def __init__(self):
        self._http = httpx.AsyncClient(timeout=60)

    @property
    def has_x402(self) -> bool:
        """Check if OWS CLI is available for x402 payments."""
        try:
            result = subprocess.run(["ows", "--version"], capture_output=True, timeout=5)
            return result.returncode == 0
        except Exception:
            return False

    @property
    def has_rest_api(self) -> bool:
        return bool(BITREFILL_API_TOKEN)

    @property
    def is_configured(self) -> bool:
        return self.has_x402 or self.has_rest_api

    async def search_products(self, query: str, country: str = "US", limit: int = 5) -> list[dict]:
        """Search Bitrefill for products (public API, no auth needed)."""
        try:
            resp = await self._http.get(
                f"{BITREFILL_REST_BASE}/search",
                params={"query": query, "country": country, "limit": limit},
            )
            resp.raise_for_status()
            return resp.json().get("products", [])
        except Exception as e:
            return [{"error": str(e)}]

    async def purchase_visa_card(self, amount_usd: float) -> dict:
        """
        Purchase a Visa gift card.
        Tries x402 first (no API key needed), falls back to REST API.
        Returns: {card_number, cvv, expiry, face_value} or error.
        """
        if self.has_x402:
            return await self._purchase_via_x402(amount_usd)
        elif self.has_rest_api:
            return await self._purchase_via_rest(amount_usd)
        else:
            raise ValueError("No payment method configured. Install OWS CLI or set BITREFILL_API_TOKEN.")

    async def _purchase_via_x402(self, amount_usd: float) -> dict:
        """
        Buy a Visa gift card using OWS x402 payment.
        Single HTTP request — OWS handles wallet signing, Bitrefill handles settlement.
        """
        url = f"{BITREFILL_X402_BASE}/purchase"
        body = json.dumps({
            "product_id": "virtual-prepaid-visa-usa",
            "value": amount_usd,
            "quantity": 1,
        })

        # Run ows pay request as subprocess (it handles the 402 challenge/response)
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, lambda: subprocess.run(
            [
                "ows", "pay", "request",
                "--wallet", OWS_WALLET_NAME,
                "--method", "POST",
                "--body", body,
                "--no-passphrase",
                url,
            ],
            capture_output=True,
            text=True,
            timeout=120,
        ))

        if result.returncode != 0:
            raise RuntimeError(f"x402 payment failed: {result.stderr.strip()}")

        # Parse the response — should contain card details
        try:
            data = json.loads(result.stdout)
            return {
                "card_number": data.get("card_number", ""),
                "cvv": data.get("cvv", ""),
                "expiry": data.get("expiry", ""),
                "face_value": data.get("value", amount_usd),
                "order_id": data.get("order_id", ""),
                "payment_method": "x402",
            }
        except json.JSONDecodeError:
            # Response might not be JSON — return raw
            return {
                "raw_response": result.stdout.strip(),
                "payment_method": "x402",
            }

    async def _purchase_via_rest(self, amount_usd: float) -> dict:
        """Fallback: buy via Bitrefill REST API with API token."""
        headers = {"Authorization": f"Bearer {BITREFILL_API_TOKEN}"}

        # 1. Create invoice
        invoice_resp = await self._http.post(
            f"{BITREFILL_REST_BASE}/invoices",
            headers=headers,
            json={
                "product_id": "virtual-prepaid-visa-usa",
                "quantity": 1,
                "value": amount_usd,
                "payment_currency": "USDC",
            },
        )
        invoice_resp.raise_for_status()
        invoice_data = invoice_resp.json()
        invoice_id = invoice_data["id"]

        return {
            "invoice_id": invoice_id,
            "payment_address": invoice_data.get("payment_address", ""),
            "payment_amount_usdc": invoice_data.get("payment_amount", amount_usd),
            "status": "awaiting_payment",
            "payment_method": "rest_api",
        }

    async def poll_invoice(self, invoice_id: str, timeout_seconds: int = 120) -> dict:
        """Poll a REST API invoice until card is ready (only needed for REST fallback)."""
        if not self.has_rest_api:
            raise ValueError("REST API not configured")

        headers = {"Authorization": f"Bearer {BITREFILL_API_TOKEN}"}

        for _ in range(timeout_seconds // 2):
            resp = await self._http.get(
                f"{BITREFILL_REST_BASE}/invoices/{invoice_id}",
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()

            if data.get("status") == "complete":
                return {
                    "card_number": data.get("card_number", ""),
                    "cvv": data.get("cvv", ""),
                    "expiry": data.get("expiry", ""),
                    "face_value": data.get("value", 0),
                }

            if data.get("status") in ("expired", "failed"):
                raise RuntimeError(f"Invoice {invoice_id} {data['status']}")

            await asyncio.sleep(2)

        raise TimeoutError(f"Invoice {invoice_id} timed out")
