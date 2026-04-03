"""OWS Wallet — Open Wallet Standard for secure key storage and signing."""
import os
import json
import ows
import httpx
from config import OWS_WALLET_NAME, OWS_PASSPHRASE, USDC_RPC_URL, USDC_CONTRACT, USDC_CHAIN


class OWSWallet:
    def __init__(self):
        # Load or create wallet
        try:
            self.wallet = ows.get_wallet(OWS_WALLET_NAME)
        except Exception:
            self.wallet = ows.create_wallet(OWS_WALLET_NAME, passphrase=OWS_PASSPHRASE or None)

        self._http = httpx.AsyncClient(timeout=15)

    @property
    def is_configured(self) -> bool:
        return self.wallet is not None

    @property
    def evm_address(self) -> str:
        """Get the EVM address from the wallet."""
        for acct in self.wallet.get("accounts", []):
            if acct["chain_id"].startswith("eip155:"):
                return acct["address"]
        return ""

    @property
    def solana_address(self) -> str:
        """Get the Solana address from the wallet."""
        for acct in self.wallet.get("accounts", []):
            if acct["chain_id"].startswith("solana:"):
                return acct["address"]
        return ""

    @property
    def address(self) -> str:
        """Get the primary address for the configured chain."""
        if USDC_CHAIN == "solana":
            return self.solana_address
        return self.evm_address

    @property
    def all_addresses(self) -> dict[str, str]:
        """Get all chain addresses."""
        return {acct["chain_id"]: acct["address"] for acct in self.wallet.get("accounts", [])}

    async def get_balance(self) -> float:
        """Get USDC balance via RPC call (OWS handles keys, not balances)."""
        if not USDC_RPC_URL:
            return 0.0

        if USDC_CHAIN == "solana":
            return await self._get_solana_balance()
        return await self._get_evm_balance()

    async def _get_evm_balance(self) -> float:
        """Query EVM USDC balance via eth_call."""
        address = self.evm_address
        if not address or not USDC_CONTRACT:
            return 0.0

        # balanceOf(address) selector = 0x70a08231 + address padded to 32 bytes
        addr_padded = address[2:].lower().zfill(64)
        call_data = f"0x70a08231{addr_padded}"

        try:
            resp = await self._http.post(USDC_RPC_URL, json={
                "jsonrpc": "2.0",
                "method": "eth_call",
                "params": [{"to": USDC_CONTRACT, "data": call_data}, "latest"],
                "id": 1,
            })
            result = resp.json().get("result", "0x0")
            raw = int(result, 16)
            return raw / 1_000_000  # USDC = 6 decimals
        except Exception:
            return 0.0

    async def _get_solana_balance(self) -> float:
        """Query Solana USDC token balance."""
        address = self.solana_address
        if not address:
            return 0.0

        try:
            resp = await self._http.post(USDC_RPC_URL, json={
                "jsonrpc": "2.0",
                "method": "getTokenAccountsByOwner",
                "params": [
                    address,
                    {"mint": USDC_CONTRACT},
                    {"encoding": "jsonParsed"},
                ],
                "id": 1,
            })
            accounts = resp.json().get("result", {}).get("value", [])
            total = 0.0
            for acct in accounts:
                info = acct.get("account", {}).get("data", {}).get("parsed", {}).get("info", {})
                amount = info.get("tokenAmount", {}).get("uiAmount", 0)
                total += float(amount or 0)
            return total
        except Exception:
            return 0.0

    def sign_and_send(self, tx_hex: str, chain: str = None, rpc_url: str = None) -> str:
        """Sign and broadcast a transaction using OWS."""
        return ows.sign_and_send(
            wallet=OWS_WALLET_NAME,
            chain=chain or USDC_CHAIN,
            tx_hex=tx_hex,
            passphrase=OWS_PASSPHRASE or None,
            rpc_url=rpc_url or USDC_RPC_URL,
        )

    def sign_transaction(self, tx_hex: str, chain: str = None) -> str:
        """Sign a transaction without broadcasting."""
        return ows.sign_transaction(
            wallet=OWS_WALLET_NAME,
            chain=chain or USDC_CHAIN,
            tx_hex=tx_hex,
            passphrase=OWS_PASSPHRASE or None,
        )
