import { describe, it, expect, vi, beforeEach } from "vitest";
import { pokerService } from "./pokerService";
import { httpClient } from "./httpClient";

vi.mock("./httpClient", () => ({
  httpClient: {
    post: vi.fn(),
  },
}));

describe("pokerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getHandEquity", () => {
    it("calls post with correct payload", async () => {
      const mockResponse = {
        equity: {
          win: [0.5, 0.5],
          tie: [0.0, 0.0],
          samples: 100000,
        },
      };

      vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

      const players = ["AhKh", "QsQd"];
      const board = "";
      const options = { mode: "rust" as const };
      const dead: string[] = [];

      const result = await pokerService.getHandEquity(
        players,
        board,
        options,
        dead,
      );

      expect(httpClient.post).toHaveBeenCalledWith(
        "/poker/equity/calculate",
        { players, board, options, dead },
        undefined,
      );
      expect(result).toEqual(mockResponse);
    });

    it("passes abort signal to httpClient", async () => {
      const mockResponse = {
        equity: {
          win: [0.6, 0.4],
          tie: [0.0, 0.0],
          samples: 50000,
        },
      };

      vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

      const abortController = new AbortController();
      const players = ["AhKh", "QsQd"];
      const board = "AsKsQd";
      const options = { mode: "rust" as const };
      const dead: string[] = [];

      await pokerService.getHandEquity(
        players,
        board,
        options,
        dead,
        abortController.signal,
      );

      expect(httpClient.post).toHaveBeenCalledWith(
        "/poker/equity/calculate",
        { players, board, options, dead },
        abortController.signal,
      );
    });

    it("includes dead cards in payload", async () => {
      const mockResponse = {
        equity: {
          win: [0.7, 0.3],
          tie: [0.0, 0.0],
          samples: 100000,
        },
      };

      vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

      const players = ["AhKh", "QsQd"];
      const board = "";
      const options = {};
      const dead = ["Js", "Jd"];

      await pokerService.getHandEquity(players, board, options, dead);

      expect(httpClient.post).toHaveBeenCalledWith(
        "/poker/equity/calculate",
        { players, board, options, dead },
        undefined,
      );
    });
  });

  describe("compareHands", () => {
    it("calls post with correct payload", async () => {
      const mockResponse = {
        hand1_wins: true,
        hand1_rank: 4,
        hand2_rank: 3,
      };

      vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

      const hand1 = "AhKh";
      const hand2 = "QsQd";
      const board = "AsKsQd2h3c";

      const result = await pokerService.compareHands(hand1, hand2, board);

      expect(httpClient.post).toHaveBeenCalledWith("/poker/hand/compare", {
        hand1,
        hand2,
        board,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("evaluateHand", () => {
    it("calls post with correct payload", async () => {
      const mockResponse = {
        handRank: 4,
        description: "Two Pair",
      };

      vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

      const hole = "AhKh";
      const board = "AsKsQd2h3c";

      const result = await pokerService.evaluateHand(hole, board);

      expect(httpClient.post).toHaveBeenCalledWith("/poker/hand/evaluate", {
        hole,
        board,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getOuts", () => {
    it("calls post with correct payload and signal", async () => {
      const mockResponse = {
        outs: [
          { card: "Ah", equity_gain: 0.15 },
          { card: "Kh", equity_gain: 0.12 },
        ],
        current_equity: 0.35,
      };

      vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

      const hero = "AhKh";
      const villain = "QsQd";
      const board = "Qs5d2h";
      const abortController = new AbortController();

      const result = await pokerService.getOuts(
        hero,
        villain,
        board,
        abortController.signal,
      );

      expect(httpClient.post).toHaveBeenCalledWith(
        "/poker/outs/calculate",
        { hero, villain, board },
        abortController.signal,
      );
      expect(result).toEqual(mockResponse);
    });

    it("works without signal parameter", async () => {
      const mockResponse = {
        outs: [],
        current_equity: 0.5,
      };

      vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

      const hero = "AhKh";
      const villain = "QsQd";
      const board = "";

      await pokerService.getOuts(hero, villain, board);

      expect(httpClient.post).toHaveBeenCalledWith(
        "/poker/outs/calculate",
        { hero, villain, board },
        undefined,
      );
    });
  });
});
