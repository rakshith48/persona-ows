"""
Persona Agent — stdio JSON protocol server.

Starts the agent, reads stdin for user messages, feeds them to the agent.
"""
import sys
import json
import asyncio
import threading
from agent import PersonaAgent


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


async def main():
    agent = PersonaAgent(emit_fn=emit)
    await agent.start()
    emit({"type": "agent_status", "status": "ready"})

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
            # Run as background task so stdin loop stays free for approval responses
            asyncio.create_task(_handle_message(agent, msg.get("text", "")))

        elif msg.get("type") == "approval_response":
            agent.resolve_approval(
                msg.get("request_id", ""),
                msg.get("approved", False),
            )


async def _handle_message(agent: PersonaAgent, text: str):
    """Handle a user message in a background task."""
    try:
        await agent.send_message(text)
    except Exception as e:
        emit({"type": "agent_text", "text": f"Error: {e}"})
        emit({"type": "agent_status", "status": "done"})


if __name__ == "__main__":
    asyncio.run(main())
