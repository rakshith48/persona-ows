"""
Persona Agent — Claude Agent SDK orchestration.

Persistent ClaudeSDKClient with streaming input mode.
Session stays alive across messages for prompt caching.
"""
import json
import asyncio
from typing import Callable
from uuid import uuid4
from pathlib import Path

from claude_agent_sdk import (
    tool,
    create_sdk_mcp_server,
    ClaudeSDKClient,
    ClaudeAgentOptions,
    AssistantMessage,
    ResultMessage,
    StreamEvent,
    TextBlock,
    ToolUseBlock,
)

from config import ANTHROPIC_MODEL, ANTHROPIC_API_KEY
from services.zinc_client import ZincClient
from services.ows_wallet import OWSWallet
# Singletons
zinc = ZincClient()
wallet = OWSWallet()


SYSTEM_PROMPT = """You are Persona, a voice-first AI purchasing agent. You help the user buy things online.

For RETAIL products (Amazon, Walmart, Target):
1. Use search_products to find items
2. Present options with names, prices, and ratings
3. Call request_approval with full price details
4. If approved: check_wallet_balance → use Bitrefill CLI to buy a gift card → place_order

For FOOD & SERVICES (Uber Eats, DoorDash, cafes, etc.):
1. Use browser-use CLI (via Skill) to browse the merchant website
2. ALWAYS use `--profile "Default" --headed` flags so the user's real Chrome opens visibly with existing logins/cookies
3. Example: `browser-use --profile "Default" --headed open https://www.ubereats.com`
4. Present options and prices found
5. Call request_approval with details
6. If approved: check_wallet_balance → use Bitrefill CLI to buy a Visa gift card → enter card at checkout via browser

For PAYMENT (via Bitrefill CLI Skill + OWS):
- FIRST try to find a merchant-specific gift card: `bitrefill search-products --query "<merchant name>" --country AU`
  Example: for Uber Eats, search "uber eats". For Amazon, search "amazon". For 7-Eleven, search "7-eleven".
- If a merchant-specific card exists, use it (cheaper, no conversion fees).
- If no merchant-specific card exists, fall back to the AU Visa gift card: product_id "the-visa-digital-gift-card-australia" (denominations: 10, 50, 100, 250 AUD)
- Buy: `bitrefill buy-products --cart_items '[{"product_id":"...", "package_id":...}]' --payment_method usdc_base`
- This returns an x402_payment_url — pay it with:
  `ows pay request --wallet persona-agent --no-passphrase <x402_payment_url>`
- After payment, use `bitrefill get-invoice-by-id --invoice_id <id> --include_redemption_info true` to get the gift card code
- Use the code/redeem at checkout via browser

Rules:
- Be concise — this is voice-first. Keep responses short and conversational.
- Call request_approval ONLY when you are about to make a payment (buy gift card, place order). Do NOT ask for approval when adding items to cart, browsing, or searching.
- If the user DENIES a purchase, do NOT call request_approval again. Ask what they'd like instead.
- ALWAYS call save_order immediately after an order is placed/paid. Do not forget this.
- Show prices in USD.
- If the user is just chatting (not buying), respond conversationally without using tools.
- The user is in Australia. Merchant prices are in AUD. Your wallet balance is in USDC (roughly 1 USD). When comparing, approximate AUD to USD (1 AUD ≈ 0.65 USD).
- For Bitrefill Visa gift cards in AU, use product_id "the-visa-digital-gift-card-australia" with denominations: 10, 50, 100, 250 AUD.
- Always find the best deal for the user — compare prices, look for discounts, pick the best value option.
- For fashion, clothing, or when you need to research products: use WebSearch to find options, then use browser-use to visit the best sites and browse them for the user.
- When suggesting delivery, use the user's profile locations (home/work) and choose based on context.
- Always include the delivery location in approval requests so the user can confirm.
- After every purchase, save what you learned to memory (preferences, favourite items, merchants, sizes, etc.) so you can make better suggestions next time."""


# --- Tool definitions ---

@tool("search_products", "Search for products on Amazon, Walmart, or Target.", {
    "query": str, "retailer": str, "max_results": int,
})
async def search_products(args):
    try:
        results = await zinc.search(args.get("query", ""), args.get("retailer", "amazon"), args.get("max_results", 5))
        return {"content": [{"type": "text", "text": json.dumps(results, indent=2)}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Search error: {e}"}], "is_error": True}


@tool("get_product_details", "Get detailed info for a specific product.", {
    "product_id": str, "retailer": str,
})
async def get_product_details(args):
    try:
        details = await zinc.get_product(args.get("product_id", ""), args.get("retailer", "amazon"))
        return {"content": [{"type": "text", "text": json.dumps(details, indent=2)}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Product details error: {e}"}], "is_error": True}


@tool("check_wallet_balance", "Check current USDC balance in the OWS wallet.", {})
async def check_wallet_balance(args):
    try:
        if not wallet.is_configured:
            return {"content": [{"type": "text", "text": "OWS wallet not initialized."}], "is_error": True}
        balance = await wallet.get_balance()
        return {"content": [{"type": "text", "text": f"USDC balance: ${balance:.2f}\nWallet: {wallet.address}"}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Wallet error: {e}"}], "is_error": True}



@tool("place_order", "Place an order on a retailer using Zinc API.", {
    "product_id": str, "retailer": str, "quantity": int,
})
async def place_order(args):
    try:
        from config import SHIPPING_ADDRESS
        order_data = {
            "retailer": args.get("retailer", "amazon"),
            "products": [{"product_id": args.get("product_id", ""), "quantity": args.get("quantity", 1)}],
            "shipping_address": SHIPPING_ADDRESS,
        }
        result = await zinc.create_order(order_data)
        return {"content": [{"type": "text", "text": json.dumps(result)}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Order error: {e}"}], "is_error": True}


@tool("request_approval", "Show the user an approval card. MUST call before any payment. Blocks until approved/denied.", {
    "item_name": str, "merchant": str, "subtotal": float, "fees": float, "total": float,
})
async def request_approval(args):
    # This tool uses the global _agent_ref to emit to Electron and wait for response
    agent = _agent_ref
    if agent is None:
        return {"content": [{"type": "text", "text": "No agent context"}], "is_error": True}

    request_id = str(uuid4())
    try:
        balance = await wallet.get_balance()
    except Exception:
        balance = 0.0

    agent.emit({
        "type": "approval_request",
        "request_id": request_id,
        "item_name": args.get("item_name", ""),
        "merchant": args.get("merchant", ""),
        "subtotal": args.get("subtotal", 0),
        "fees": args.get("fees", 0),
        "total": args.get("total", 0),
        "wallet_balance": balance,
    })

    future: asyncio.Future[bool] = asyncio.get_event_loop().create_future()
    _global_approval_futures[request_id] = future

    try:
        approved = await asyncio.wait_for(future, timeout=120)
    except asyncio.TimeoutError:
        return {"content": [{"type": "text", "text": "Approval timed out."}], "is_error": True}

    if approved:
        return {"content": [{"type": "text", "text": "User APPROVED. Proceed with payment. You MUST call save_order immediately after the order is placed."}]}
    else:
        return {"content": [{"type": "text", "text": "User DENIED. Ask what they'd like instead."}]}


@tool("save_order", "Save a completed order to the database. Call ONLY after payment is confirmed and order is placed.", {
    "item_name": str, "merchant": str, "total": float, "status": str,
})
async def save_order(args):
    agent = _agent_ref
    if agent is None:
        return {"content": [{"type": "text", "text": "No agent context"}], "is_error": True}
    order_id = str(uuid4())
    agent.emit({
        "type": "order_update",
        "order": {
            "id": order_id,
            "item_name": args.get("item_name", ""),
            "price": args.get("total", 0),
            "merchant": args.get("merchant", ""),
            "status": args.get("status", "placed"),
        },
    })
    return {"content": [{"type": "text", "text": f"Order saved (ID: {order_id})"}]}


# Bundle tools into SDK MCP server (browser handled by browser-use skill)
_tools_server = create_sdk_mcp_server("persona-tools", tools=[
    search_products, get_product_details, check_wallet_balance,
    place_order, request_approval, save_order,
])

# Global ref for approval tool to access emit function and futures
_agent_ref = None
_global_approval_futures: dict[str, asyncio.Future] = {}

# Status map for tool use display
_TOOL_STATUS = {
    "search_products": "Searching products...",
    "get_product_details": "Getting product details...",
    "check_wallet_balance": "Checking wallet...",
    "place_order": "Placing order...",
    "request_approval": "Waiting for approval...",
    "Skill": "Loading skill...",
}


class PersonaAgent:
    def __init__(self, emit_fn: Callable[[dict], None]):
        self.emit = emit_fn
        self._approval_futures: dict[str, asyncio.Future] = {}
        self._options = None
        self._running = False
        self._first_message = True
        self._last_text = ""

    async def start(self):
        """Initialize the persistent agent session."""
        global _agent_ref
        _agent_ref = self

        self._options = ClaudeAgentOptions(
            system_prompt=SYSTEM_PROMPT,
            model=ANTHROPIC_MODEL,
            max_turns=100,
            mcp_servers={"persona": _tools_server},
            allowed_tools=[
                "mcp__persona__*",      # Our custom tools
                "Skill",                 # Skills (browser-use, bitrefill-cli)
                "Bash(browser-use:*)",   # browser-use CLI commands
                "Bash(bitrefill:*)",     # bitrefill CLI commands
                "Bash(ows:*)",           # OWS wallet commands (pay x402, check balance)
                "WebSearch",             # Search the web for products, reviews, fashion
                "Read",                  # Read context files
                "Write",                 # Write memory files
            ],
            permission_mode="dontAsk",
            setting_sources=["project"],  # Load .claude/skills/ from project dir
            cwd=str(Path(__file__).parent.parent),  # Project root
            env={"ANTHROPIC_API_KEY": ANTHROPIC_API_KEY} if ANTHROPIC_API_KEY else {},
            include_partial_messages=True,
        )
        self._running = True
        self._first_message = True

    async def send_message(self, text: str):
        """Send a user message. Uses persistent session with caching."""
        self.emit({"type": "agent_status", "status": "thinking"})
        self._last_text = ""

        # After first message, continue the same session for cache reuse
        if not self._first_message:
            self._options.continue_conversation = True
        self._first_message = False

        async with ClaudeSDKClient(options=self._options) as client:
            await client.query(text)
            async for message in client.receive_response():
                self._process_message(message)

    def _process_message(self, message):
        """Route SDK messages to Electron."""
        if isinstance(message, StreamEvent):
            event = message.event
            if event.get("type") == "content_block_delta":
                delta = event.get("delta", {})
                if delta.get("type") == "text_delta":
                    self.emit({"type": "agent_text_delta", "text": delta["text"]})

        elif isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock) and block.text.strip():
                    if block.text != self._last_text:
                        self._last_text = block.text
                        self.emit({"type": "agent_text", "text": block.text})
                elif isinstance(block, ToolUseBlock):
                    short = block.name.split("__")[-1] if "__" in block.name else block.name
                    # Smart status for Bash based on command content
                    if short == "Bash":
                        cmd = block.input.get("command", "") if isinstance(block.input, dict) else ""
                        if "bitrefill" in cmd:
                            status = "Running Bitrefill..."
                        elif "ows pay" in cmd:
                            status = "Processing payment..."
                        elif "ows fund" in cmd or "ows wallet" in cmd:
                            status = "Checking wallet..."
                        elif "browser-use" in cmd:
                            status = "Controlling browser..."
                        else:
                            status = "Running command..."
                    else:
                        status = _TOOL_STATUS.get(short, f"Using {short}...")
                    self.emit({"type": "agent_status", "status": "tool_calling", "detail": status})

        elif isinstance(message, ResultMessage):
            self.emit({"type": "agent_status", "status": "done"})

    def resolve_approval(self, request_id: str, approved: bool):
        """Resolve a pending approval request from the UI."""
        resolve_approval_global(request_id, approved)


def resolve_approval_global(request_id: str, approved: bool):
    """Resolve approval from any session (main agent or proactive executor)."""
    future = _global_approval_futures.pop(request_id, None)
    if future and not future.done():
        future.set_result(approved)
