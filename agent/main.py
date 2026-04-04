"""
Persona Agent — stdio JSON protocol server.

Main chat agent + proactive suggestion engine (three stages).
"""
import sys
import json
import asyncio
import threading
from agent import PersonaAgent

# Proactive check interval (seconds)
PROACTIVE_INTERVAL = 1800  # 30 min


def emit(msg: dict):
    """Write a JSON message to stdout for Electron to consume."""
    sys.stdout.write(json.dumps(msg) + '\n')
    sys.stdout.flush()


def read_stdin(loop: asyncio.AbstractEventLoop, queue: asyncio.Queue):
    """Read stdin in a thread."""
    for line in sys.stdin:
        line = line.strip()
        if line:
            asyncio.run_coroutine_threadsafe(queue.put(line), loop)


async def proactive_loop():
    """Stage 1: Lightweight decision checks on a timer."""
    from proactive import run_decide

    await asyncio.sleep(15)  # Wait for app to initialize

    while True:
        try:
            await run_decide(emit)
        except Exception as e:
            emit({"type": "proactive_log", "text": f"[proactive] error: {e}"})

        await asyncio.sleep(PROACTIVE_INTERVAL)


async def main():
    agent = PersonaAgent(emit_fn=emit)
    await agent.start()
    emit({"type": "agent_status", "status": "ready"})

    # Start proactive Stage 1 loop
    asyncio.create_task(proactive_loop())

    # Read stdin in a background thread
    stdin_queue: asyncio.Queue[str] = asyncio.Queue()
    loop = asyncio.get_event_loop()
    thread = threading.Thread(target=read_stdin, args=(loop, stdin_queue), daemon=True)
    thread.start()

    while True:
        line = await stdin_queue.get()

        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            continue

        if msg.get("type") == "user_message":
            asyncio.create_task(_handle_message(agent, msg.get("text", "")))

        elif msg.get("type") == "approval_response":
            from agent import resolve_approval_global
            resolve_approval_global(
                msg.get("request_id", ""),
                msg.get("approved", False),
            )

        elif msg.get("type") == "proactive_approve":
            # User tapped "Yes, prep it" — trigger Stage 2+3
            from proactive import run_execute
            suggestion = msg.get("text", "")
            asyncio.create_task(run_execute(suggestion, emit))

        elif msg.get("type") == "proactive_dismiss":
            # User tapped "No thanks"
            from proactive import dismiss_notification
            dismiss_notification()


async def _handle_message(agent: PersonaAgent, text: str):
    """Handle a user message in a background task."""
    try:
        await agent.send_message(text)
    except Exception as e:
        emit({"type": "agent_text", "text": f"Error: {e}"})
        emit({"type": "agent_status", "status": "done"})


if __name__ == "__main__":
    asyncio.run(main())
