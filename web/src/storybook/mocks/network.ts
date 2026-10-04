import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";
import { handList, replayHand, table } from "../fixtures";
import { installRequestBoundary } from "./requests";

export const handlers = [
  http.get("*/auth/me", () => HttpResponse.json({ user: { userId: "storybook-user", email: "alex@example.test" } })),
  http.get("*/api/tables", () => HttpResponse.json({ tables: [{ id: "storybook-table", name: "Friday table", seats: 2, maxPlayers: 8, smallBlind: 5, bigBlind: 10, street: "waiting", gameMode: "holdem" }] })),
  http.post("*/api/tables", () => HttpResponse.json(table({ street: "waiting", actor: null, deadline: null, legal: null, canDeal: true }))),
  http.get("*/api/tables/:id", () => HttpResponse.json(table())),
  http.post("*/api/tables/:id/commands", () => HttpResponse.json(table({ version: 2 }))),
  http.post("*/api/tables/:id/agents", () => HttpResponse.json({ table: table(), token: "storybook-fake-credential", agentId: "storybook-agent" })),
  http.post("*/api/tables/:id/revoke-agent", () => HttpResponse.json(table({ version: 2 }))),
  http.get("*/hands", () => HttpResponse.json({ hands: handList(), nextCursor: null })),
  http.get("*/hands/:id", () => HttpResponse.json(replayHand())),
  http.post("*/hands", () => HttpResponse.json({ hand_id: "storybook-hand-0" })),
  http.delete("*/hands/:id", () => new HttpResponse(null, { status: 204 })),
  http.post("*/poker/equity/calculate", () => HttpResponse.json({ equity: { win: [0.72, 0.25], tie: [0.03, 0.03], lose: [0.25, 0.72], samples: 10000 }, players: [], board: [], dead: [] })),
  http.post("*/poker/outs/calculate", () => HttpResponse.json({ suppressed: null, win_outs: [], tie_outs: [], baseline_win: 0.72, baseline_tie: 0.03, baseline_lose: 0.25, total_river_cards: 44 })),
];
export const worker = setupWorker();
let started: Promise<unknown> | undefined;
export async function startWorker() {
  started ??= worker.start({
    quiet: true,
    onUnhandledRequest(request, print) {
      const url = new URL(request.url);
      const asset = request.method === "GET" && /^\/(?:@|\.storybook\/|src\/|node_modules\/|assets\/|sb-|index\.json|iframe\.html|mockServiceWorker\.js|vite-inject-mocker-entry\.js|favicon)/.test(url.pathname);
      if (url.origin !== location.origin || !asset) print.error();
    },
  });
  await started;
  installRequestBoundary();
  return worker;
}
