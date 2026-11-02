"""Play one seat through the gateway with the official MCP Python SDK.

Usage: python_client.py <endpoint>. The seat credential comes from the
SEAT_CREDENTIAL environment variable, so it never appears in a process list.
Prints one JSON summary line with no credential or card data.
"""
import asyncio
import json
import os
import sys
import uuid
from importlib.metadata import version

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client


async def main(endpoint: str) -> None:
    token = os.environ["SEAT_CREDENTIAL"]
    async with streamablehttp_client(endpoint, headers={"Authorization": f"Bearer {token}"}) as (read, write, _):
        async with ClientSession(read, write) as session:
            init = await session.initialize()
            tools = sorted(t.name for t in (await session.list_tools()).tools)
            rules = (await session.read_resource("poker://rules")).contents[0].text

            async def call(name, args=None):
                result = await session.call_tool(name, args or {})
                if result.isError:
                    raise RuntimeError(result.content[0].text)
                return result.structuredContent

            view = await call("poker_get_table")
            seat = view["yourSeat"]
            view = await call("poker_ready", {"version": view["version"], "requestId": str(uuid.uuid4()), "ready": True})
            actions = 0
            # Each in-play snapshot is one privacy sample: own two cards shown,
            # every opponent's hidden. The runner requires at least one sample.
            samples = 0
            leaks = 0
            for _ in range(200):
                if view["street"] == "complete" and view["handNumber"] >= 1:
                    break
                if view["street"] == "waiting":
                    await asyncio.sleep(0.3)
                    view = await call("poker_get_table")
                    continue
                view = await call("poker_wait_for_turn", {"seconds": 10})
                if view["street"] not in ("waiting", "complete"):
                    samples += 1
                    for s in view["seats"]:
                        if len(s["cards"]) != (2 if s["seat"] == seat else 0):
                            leaks += 1
                if view.get("legal") and view["actor"] == seat:
                    action = "check" if view["legal"]["check"] else "call"
                    view = await call("poker_act", {"version": view["version"], "requestId": str(uuid.uuid4()), "action": action})
                    actions += 1
            record = await call("poker_get_hand", {"handNumber": 1})
            mine = next(p for p in record["players"] if p["isYou"])
            print(json.dumps({
                "client": "mcp-python", "sdkVersion": version("mcp"), "protocolVersion": init.protocolVersion,
                "server": init.serverInfo.name, "tools": tools, "rulesHaveNoCashValue": "no cash value" in rules,
                "seat": seat, "actions": actions, "street": view["street"], "ownArchiveCards": len(mine["cards"]),
                "privacySamples": samples, "privacyLeaks": leaks, "stackTotal": sum(s["stack"] for s in view["seats"]),
            }))


asyncio.run(main(sys.argv[1]))
