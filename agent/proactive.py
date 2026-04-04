"""
Proactive suggestion engine.

Three stages:
  Stage 1: DECIDE — lightweight timer, checks calendar + profile, emits notification
  Stage 2+3: EXECUTE — separate session, browser + payment, triggered by user tap

State machine:
  suggested_hashes — already suggested events (skip duplicates)
  pending_notification — notification shown, waiting for user response
  executing — Stage 2+3 is running
"""
import json
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Callable

from claude_agent_sdk import query, ClaudeAgentOptions, ResultMessage, AssistantMessage, TextBlock
from config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL

CONTEXT_DIR = Path(__file__).parent / "context"
SUGGESTED_FILE = CONTEXT_DIR / ".suggested.json"

# --- State ---
pending_notification = False
executing = False

# --- Persistence ---

MAX_SUGGESTIONS = 50

def _load_suggested() -> list[str]:
    """Load list of already-suggested items (human-readable strings)."""
    try:
        return json.loads(SUGGESTED_FILE.read_text())
    except Exception:
        return []


def _save_suggested(items: list[str]):
    """Save suggestions, keeping only the most recent MAX_SUGGESTIONS."""
    SUGGESTED_FILE.write_text(json.dumps(items[-MAX_SUGGESTIONS:]))


def _load_profile() -> dict:
    try:
        return json.loads((CONTEXT_DIR / "profile.json").read_text())
    except Exception:
        return {}


def _load_recurring() -> list[dict]:
    """Load recurring purchase patterns from bank statement analysis."""
    try:
        return json.loads((CONTEXT_DIR / "recurring.json").read_text())
    except Exception:
        return []


def _load_location() -> dict | None:
    try:
        return json.loads((CONTEXT_DIR / "location.json").read_text())
    except Exception:
        return None


# --- Stage 1: DECIDE (lightweight, no tools except calendar) ---

DECIDE_PROMPT_TEMPLATE = """[PROACTIVE CHECK — {time}]

Check my calendar for TWO time horizons:
1. IMMEDIATE (next 3 hours): events starting soon that need food, coffee, or transport
2. UPCOMING (next 7 days): birthdays, special occasions, recurring needs

User profile:
{profile}

Already suggested (DO NOT suggest these again):
{already_suggested}

Should you proactively suggest a NEW purchase? Examples:
- Coffee/food 30-60 min before a deep work or focus session
- Transport 30 min before dinner at a restaurant
- Gift 2-3 days before a birthday or special occasion
- Restock items the user orders regularly

If YES: respond with a SHORT one-line suggestion including the specific item, merchant, and delivery location.
If NO (or already suggested): respond with exactly: [NO_SUGGESTION]

IMPORTANT: Only return the suggestion text. Do NOT browse or buy anything."""


async def run_decide(emit_fn: Callable[[dict], None]) -> str | None:
    """Stage 1: Lightweight check. Returns suggestion text or None."""
    global pending_notification

    # Guards
    if pending_notification:
        emit_fn({"type": "proactive_log", "text": "[proactive] notification pending, skipping"})
        return None
    if executing:
        emit_fn({"type": "proactive_log", "text": "[proactive] execution in progress, skipping"})
        return None

    profile = _load_profile()
    already_suggested = _load_suggested()
    recurring = _load_recurring()
    location = _load_location()
    now = datetime.now()

    location_str = "Unknown"
    if location:
        location_str = f"GPS: {location.get('lat', 0):.4f}, {location.get('lng', 0):.4f}"

    recurring_str = "None — upload bank statement in Settings to enable"
    if recurring:
        recurring_str = json.dumps(recurring[:10], indent=2)  # Top 10 patterns

    prompt = DECIDE_PROMPT_TEMPLATE.format(
        time=now.strftime('%A %B %d, %I:%M %p'),
        profile=json.dumps(profile, indent=2) if profile else "No profile",
        already_suggested="\n".join(f"- {s}" for s in already_suggested) if already_suggested else "None yet",
    ) + f"\n\nRecurring purchases (from bank history):\n{recurring_str}\n\nIf a recurring purchase is overdue (last_purchase + frequency_days ≤ today), suggest reordering.\n\nCurrent location: {location_str}"

    options = ClaudeAgentOptions(
        system_prompt="You are a proactive assistant. Check the calendar and decide if a purchase should be suggested. Be concise. Do NOT use browser or make purchases.",
        model=ANTHROPIC_MODEL,
        max_turns=5,  # Lightweight — just read calendar and decide
        mcp_servers={
            "google-calendar": {
                "type": "http",
                "url": "https://gcal.mcp.claude.com/mcp",
            },
        },
        allowed_tools=["mcp__google-calendar__*"],
        permission_mode="dontAsk",
        env={"ANTHROPIC_API_KEY": ANTHROPIC_API_KEY} if ANTHROPIC_API_KEY else {},
    )

    emit_fn({"type": "proactive_log", "text": "[proactive] Stage 1: deciding..."})

    result_text = ""
    async for message in query(prompt=prompt, options=options):
        if isinstance(message, ResultMessage) and message.result:
            result_text = message.result
        elif isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock) and block.text.strip():
                    result_text = block.text

    emit_fn({"type": "proactive_log", "text": f"[proactive] Stage 1 result: {result_text[:100]}"})

    if not result_text or "[NO_SUGGESTION]" in result_text:
        emit_fn({"type": "proactive_log", "text": "[proactive] no suggestion needed"})
        return None

    # Record and emit notification
    already_suggested.append(result_text[:150])
    _save_suggested(already_suggested)
    pending_notification = True

    emit_fn({
        "type": "proactive_notification",
        "text": result_text,
    })

    return result_text


# --- Stage 2+3: EXECUTE (separate session, browser + payment) ---

EXECUTE_PROMPT_TEMPLATE = """The user approved this proactive suggestion:

"{suggestion}"

User profile:
{profile}

Now execute it:
1. Open the merchant website using browser-use with --profile "Default" --headed
2. Add the item to cart
3. Navigate to checkout
4. Call request_approval with the final price breakdown and delivery location
5. If approved: buy a gift card via Bitrefill CLI and complete payment
6. Call save_order to record the purchase

Use the delivery location from the user profile."""


async def run_execute(suggestion: str, emit_fn: Callable[[dict], None]):
    """Stage 2+3: Full execution — browser, cart, payment. Separate session."""
    global executing, pending_notification

    executing = True
    pending_notification = False

    profile = _load_profile()

    prompt = EXECUTE_PROMPT_TEMPLATE.format(
        suggestion=suggestion,
        profile=json.dumps(profile, indent=2) if profile else "No profile",
    )

    # Import the tools server so executor can use request_approval and save_order
    from agent import _tools_server

    options = ClaudeAgentOptions(
        system_prompt="You are Persona's execution agent. Complete the purchase the user approved. Use browser-use for merchant websites, Bitrefill CLI for payment. Use request_approval to get final payment approval. Use save_order after purchase is complete.",
        model=ANTHROPIC_MODEL,
        max_turns=100,
        mcp_servers={"persona": _tools_server},
        allowed_tools=[
            "mcp__persona__*",
            "Skill",
            "Bash(browser-use:*)",
            "Bash(bitrefill:*)",
            "Bash(ows:*)",
            "WebSearch",
        ],
        permission_mode="dontAsk",
        setting_sources=["project"],
        cwd=str(Path(__file__).parent.parent),
        env={"ANTHROPIC_API_KEY": ANTHROPIC_API_KEY} if ANTHROPIC_API_KEY else {},
    )

    # Set global ref so request_approval tool can emit to UI
    import agent as agent_module
    class _EmitProxy:
        def __init__(self, fn): self.emit = fn
        _approval_futures = {}  # unused, global futures handle this
    agent_module._agent_ref = _EmitProxy(emit_fn)

    emit_fn({"type": "proactive_log", "text": "[proactive] Stage 2+3: executing..."})
    emit_fn({"type": "agent_status", "status": "thinking"})

    try:
        async for message in query(prompt=prompt, options=options):
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock) and block.text.strip():
                        emit_fn({"type": "agent_text", "text": block.text})
            elif isinstance(message, ResultMessage):
                emit_fn({"type": "proactive_log", "text": f"[proactive] Stage 2+3 done: {(message.result or '')[:80]}"})
    except Exception as e:
        emit_fn({"type": "proactive_log", "text": f"[proactive] Stage 2+3 error: {e}"})
        emit_fn({"type": "agent_text", "text": f"Proactive order failed: {e}"})
    finally:
        executing = False
        emit_fn({"type": "agent_status", "status": "done"})


def dismiss_notification():
    """Called when user dismisses the proactive notification."""
    global pending_notification
    pending_notification = False


# --- Bank Statement Analysis (separate one-shot agent) ---

BANK_ANALYSIS_PROMPT = """Read the bank statement CSV at agent/context/bank_statement.csv.

Analyze ALL transactions and find recurring purchases — items bought 3+ times with a regular pattern.

For each recurring purchase, extract:
- merchant: the merchant/store name
- item: what they typically buy (infer from description)
- amount_avg: average transaction amount
- frequency_days: how often they buy (in days)
- last_purchase: date of the most recent transaction (YYYY-MM-DD)
- category: food/coffee/health/transport/shopping/subscription/other

Write the results as a JSON array to agent/context/recurring.json.

After writing, summarize what you found."""


async def analyze_bank_statement(emit_fn: Callable[[dict], None]):
    """One-shot analysis of bank statement CSV. Writes recurring.json."""
    emit_fn({"type": "proactive_log", "text": "[bank] starting analysis..."})
    emit_fn({"type": "agent_text", "text": "Analyzing your bank statement for recurring purchases..."})

    options = ClaudeAgentOptions(
        system_prompt="You are a financial analyst. Analyze bank statement CSVs to find recurring purchase patterns. Be thorough but concise.",
        model=ANTHROPIC_MODEL,
        max_turns=10,
        allowed_tools=["Read", "Write"],
        permission_mode="dontAsk",
        cwd=str(Path(__file__).parent.parent),
        env={"ANTHROPIC_API_KEY": ANTHROPIC_API_KEY} if ANTHROPIC_API_KEY else {},
    )

    async for message in query(prompt=BANK_ANALYSIS_PROMPT, options=options):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock) and block.text.strip():
                    emit_fn({"type": "agent_text", "text": block.text})
        elif isinstance(message, ResultMessage):
            emit_fn({"type": "proactive_log", "text": f"[bank] analysis done"})
            emit_fn({"type": "agent_status", "status": "done"})
