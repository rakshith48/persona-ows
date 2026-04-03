"""Pydantic models for Persona data types."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class GiftCard(BaseModel):
    id: str
    card_number: str
    cvv: str
    expiry: str
    initial_amount: float
    remaining_amount: float
    created_at: datetime = datetime.now()


class Order(BaseModel):
    id: str
    item_name: str
    price: float
    merchant: str
    status: str = "pending"
    card_id: Optional[str] = None
    zinc_order_id: Optional[str] = None
    details: Optional[dict] = None
    created_at: datetime = datetime.now()


class ApprovalRequest(BaseModel):
    request_id: str
    item_name: str
    merchant: str
    subtotal: float
    fees: float
    total: float
    wallet_balance: float = 0.0
