"""Browser automation service using browser-use CLI.

The CLI controls the browser directly (navigate, click, fill, screenshot).
No separate LLM/API key needed — the Agent SDK's Claude handles reasoning,
the CLI just executes browser commands.
"""
import asyncio
import subprocess
import json


class BrowserService:
    def __init__(self, profile: str = "Default"):
        self.profile = profile

    async def run_command(self, *args: str) -> str:
        """Run a browser-use CLI command and return output."""
        cmd = ["browser-use", *args, "--profile", self.profile]
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, lambda: subprocess.run(
            cmd, capture_output=True, text=True, timeout=30,
        ))
        output = result.stdout.strip()
        if result.returncode != 0 and result.stderr.strip():
            output += f"\nError: {result.stderr.strip()}"
        return output or "(no output)"

    async def navigate(self, url: str) -> str:
        """Navigate to a URL."""
        return await self.run_command("navigate", url)

    async def snapshot(self) -> str:
        """Take an accessibility snapshot of the current page."""
        return await self.run_command("snapshot")

    async def click(self, selector: str) -> str:
        """Click an element."""
        return await self.run_command("click", selector)

    async def fill(self, selector: str, text: str) -> str:
        """Fill a form field."""
        return await self.run_command("fill", selector, text)

    async def screenshot(self) -> str:
        """Take a screenshot and return the path."""
        return await self.run_command("screenshot")

    async def run_task(self, task: str, url: str) -> str:
        """High-level: navigate to URL and describe what's on the page."""
        nav_result = await self.navigate(url)
        snapshot = await self.snapshot()
        return f"Navigated to {url}:\n{nav_result}\n\nPage content:\n{snapshot}"
