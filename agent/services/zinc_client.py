"""Zinc API client for retail product search and ordering."""
import httpx
from config import ZINC_API_KEY

BASE_URL = "https://api.zinc.io/v1"


class ZincClient:
    def __init__(self):
        self.client = httpx.AsyncClient(
            base_url=BASE_URL,
            headers={"Authorization": f"Bearer {ZINC_API_KEY}"},
            timeout=30,
        )

    async def search(self, query: str, retailer: str = "amazon", max_results: int = 5) -> list[dict]:
        """Search for products."""
        resp = await self.client.get("/search", params={
            "query": query,
            "retailer": retailer,
            "max_results": max_results,
        })
        resp.raise_for_status()
        return resp.json().get("results", [])

    async def get_product(self, product_id: str, retailer: str = "amazon") -> dict:
        """Get product details."""
        resp = await self.client.get(f"/products/{product_id}", params={"retailer": retailer})
        resp.raise_for_status()
        return resp.json()

    async def create_order(self, order_data: dict) -> dict:
        """Place an order."""
        resp = await self.client.post("/orders", json=order_data)
        resp.raise_for_status()
        return resp.json()

    async def get_order_status(self, order_id: str) -> dict:
        """Check order status."""
        resp = await self.client.get(f"/orders/{order_id}")
        resp.raise_for_status()
        return resp.json()
