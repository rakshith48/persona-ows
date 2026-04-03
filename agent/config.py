"""
Configuration — loaded from .env file and environment variables.
"""
import os
from pathlib import Path

# Load .env from project root (two levels up from agent/)
_env_path = Path(__file__).parent.parent / ".env"
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip()
            if key and value:
                os.environ.setdefault(key, value)

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")

ZINC_API_KEY = os.environ.get("ZINC_API_KEY", "")
BITREFILL_API_TOKEN = os.environ.get("BITREFILL_API_TOKEN", "")  # optional — x402 via OWS is preferred

# OWS (Open Wallet Standard)
OWS_WALLET_NAME = os.environ.get("OWS_WALLET_NAME", "persona-agent")
OWS_PASSPHRASE = os.environ.get("OWS_PASSPHRASE", "")

# USDC balance queries (OWS handles signing, RPC handles reads)
USDC_RPC_URL = os.environ.get("USDC_RPC_URL", "https://mainnet.base.org")
USDC_CONTRACT = os.environ.get("USDC_CONTRACT", "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")  # USDC on Base
USDC_CHAIN = os.environ.get("USDC_CHAIN", "evm")

# Shipping address (hardcoded for V1)
SHIPPING_ADDRESS = {
    "first_name": os.environ.get("SHIPPING_FIRST_NAME", ""),
    "last_name": os.environ.get("SHIPPING_LAST_NAME", ""),
    "address_line1": os.environ.get("SHIPPING_ADDRESS_LINE1", ""),
    "city": os.environ.get("SHIPPING_CITY", ""),
    "state": os.environ.get("SHIPPING_STATE", ""),
    "postal_code": os.environ.get("SHIPPING_POSTAL_CODE", ""),
    "country": os.environ.get("SHIPPING_COUNTRY", "AU"),
    "phone_number": os.environ.get("SHIPPING_PHONE", ""),
}
