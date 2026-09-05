import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEquityCalculatorStore as useStore } from "./useEquityCalculatorStore";
import { STUDY_EXAMPLES } from "@/lib/poker/scenario";
import { pokerService } from "@/services";
import type {
  CalculateEquityResponse,
  EvaluateHandResponse,
} from "@common/interfaces";

vi.mock("@/services", () => ({
  pokerService: { getHandEquity: vi.fn(), evaluateHand: vi.fn() },
}));
const response = (win: number[], tie: number[] = [0, 0]) =>
  ({
    equity: { win, tie, lose: [0, 0], samples: 1 },
  }) as CalculateEquityResponse;
const store = () => useStore.getState();

describe("equity result integrity", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    store().resetAll();
  });
  afterEach(() => {
    store().dispose();
    vi.useRealTimers();
  });
  it("clears an old result immediately and ignores a request that completes after a card is cleared", async () => {
    let resolve!: (result: CalculateEquityResponse) => void;
    vi.mocked(pokerService.getHandEquity).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    store().loadScenario(STUDY_EXAMPLES[1].scenario);
    const pending = store().checkAndCalculateEquity();
    store().clearCard({ kind: "player", playerIndex: 0, cardIndex: 0 });
    expect(store().equity.status).toBe("idle");
    resolve(response([0.75, 0.25]));
    await pending;
    expect(store().equity.data).toBeNull();
  });
  it("does not omit an active player with an incomplete hand", async () => {
    store().loadScenario(STUDY_EXAMPLES[1].scenario);
    store().addPlayer(2);
    await store().checkAndCalculateEquity();
    expect(pokerService.getHandEquity).not.toHaveBeenCalled();
    expect(store().equity.status).toBe("idle");
  });
  it("keeps decimal win values and never names a winner before the river", async () => {
    vi.mocked(pokerService.getHandEquity).mockResolvedValue(
      response([0.8194, 0.1806]),
    );
    store().loadScenario(STUDY_EXAMPLES[0].scenario);
    await store().checkAndCalculateEquity();
    expect(store().getPlayerEquity(0)).toBeCloseTo(81.94);
    expect(store().getWinningPlayers()).toEqual([]);
  });
  it("recognizes tied winners by their pot share", async () => {
    vi.mocked(pokerService.getHandEquity).mockResolvedValue(
      response([0, 0], [0.5, 0.5]),
    );
    vi.mocked(pokerService.evaluateHand).mockRejectedValue(
      new Error("Description unavailable"),
    );
    store().loadScenario(STUDY_EXAMPLES[2].scenario);
    await store().checkAndCalculateEquity();
    expect(store().getWinningPlayers()).toEqual([0, 1]);
  });
  it("ignores a late hand description after the board changes", async () => {
    let resolve!: (result: EvaluateHandResponse) => void;
    vi.mocked(pokerService.getHandEquity).mockResolvedValue(response([1, 0]));
    vi.mocked(pokerService.evaluateHand).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    store().loadScenario(STUDY_EXAMPLES[2].scenario);
    const pending = store().checkAndCalculateEquity();
    await Promise.resolve();
    store().clearCard({ kind: "board", boardIndex: 4 });
    resolve({
      handRank: { category: "flush", ranks: [14, 12, 11, 7, 3] },
    } as unknown as EvaluateHandResponse);
    await pending;
    expect(store().winningHandRank).toBeNull();
    expect(store().boardCardsUsedInWinningHand.size).toBe(0);
  });
});
