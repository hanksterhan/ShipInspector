import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handler as evaluate } from "./evaluate";
import { handler as compare } from "./compare";
import { handler as equity } from "./equity";
import { handler as outs } from "./outs";
import { handler as recorder } from "../hands";
import { computeEquity } from "@lib/poker/equity";
import { calculateTurnOuts } from "@lib/poker/outs";

jest.mock("../../api-utils/auth", () => ({ requireAuth: () => ({ userId: "mode-user" }) }));
jest.mock("../../api-utils/redisClient", () => ({ getRedisClient: () => null }));
jest.mock("@lib/poker/equity", () => ({ computeEquity: jest.fn() }));
jest.mock("@lib/poker/outs", () => ({ calculateTurnOuts: jest.fn() }));
async function post(handler: (req: VercelRequest, res: VercelResponse) => Promise<void>, body: unknown) {
  let status = 200; let data: any;
  const req = { method: "POST", url: "/mode-test", body, headers: {}, socket: {} } as VercelRequest;
  const res = { setHeader() {}, status(code: number) { status = code; return this; }, json(value: unknown) { data = value; return this; } } as unknown as VercelResponse;
  await handler(req, res); return { status, data };
}
const board = "2h 3d 4c 9s 11h";
describe("legacy tools reject unsupported game modes before compute or storage", () => {
  beforeAll(() => { jest.spyOn(console, "log").mockImplementation(() => {}); });
  afterAll(() => { jest.restoreAllMocks(); });
  it.each([
    ["evaluate", evaluate, { hole: "14s 14h", board }],
    ["compare", compare, { hand1: "14s 14h", hand2: "13s 13h", board }],
    ["equity", equity, { players: ["14s 14h", "13s 13h"], board }],
    ["outs", outs, { hero: "14s 14h", villain: "13s 13h", board: "2h 3d 4c 9s" }],
    ["recorder", recorder, { hand: { table_size: 2, button_seat: 0, small_blind: 5, big_blind: 10, ante: 0 }, players: [], actions: [] }],
  ] as const)("%s refuses Red River even with a short board", async (_, handler, body) => {
    const result = await post(handler, { ...body, gameMode: "red-river-holdem" });
    expect(result.status).toBe(400);
    expect(JSON.stringify(result.data)).toContain("Hold'em only");
    expect(computeEquity).not.toHaveBeenCalled(); expect(calculateTurnOuts).not.toHaveBeenCalled();
  });
  it("rejects long boards without invoking equity and still evaluates a normal Hold'em hand", async () => {
    expect((await post(equity, { players: ["14s 14h", "13s 13h"], board: `${board} 12c` })).status).toBe(400);
    expect(computeEquity).not.toHaveBeenCalled();
    const result = await post(evaluate, { gameMode: "holdem", hole: "14s 14h", board });
    expect(result.status).toBe(200); expect(result.data.handRank).toMatchObject({ category: 1, tiebreak: [14, 11, 9, 4] });
  });
  it("rejects extra recorder fields instead of dropping complete-board data", async () => {
    const result = await post(recorder, { hand: { table_size: 2, button_seat: 0, small_blind: 5, big_blind: 10, ante: 0, rivers: ["11h", "12c"] }, players: [], actions: [] });
    expect(result.status).toBe(400);
    expect(JSON.stringify(result.data)).toContain("Unrecognized key");
  });
});
