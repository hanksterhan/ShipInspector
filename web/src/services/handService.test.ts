import { describe, it, expect, vi, beforeEach } from "vitest";
import { handService } from "./handService";
import { httpClient } from "./httpClient";
import type { HandSaveRequest } from "@common/interfaces";

vi.mock("./httpClient", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("handService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createHand", () => {
    it("calls post with correct path and payload", async () => {
      const mockPayload: HandSaveRequest = {
        hand: {
          table_size: 6,
          button_seat: 0,
          small_blind: 50,
          big_blind: 100,
          ante: 0,
          board_flop_1: null,
          board_flop_2: null,
          board_flop_3: null,
          board_turn: null,
          board_river: null,
        },
        players: [
          {
            seat_index: 0,
            display_name: "Alice",
            stack_at_start: 10000,
            is_hero: true,
            showdown_card_1: null,
            showdown_card_2: null,
          },
        ],
        actions: [],
      };

      const mockResponse = { hand_id: "hand-123" };
      vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

      const result = await handService.createHand(mockPayload);

      expect(httpClient.post).toHaveBeenCalledWith("/hands", mockPayload);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getHand", () => {
    it("calls get with correct path", async () => {
      const mockResponse = {
        hand: {
          id: "hand-123",
          table_size: 6,
          button_seat: 0,
          small_blind: 50,
          big_blind: 100,
          ante: 0,
          board_flop_1: null,
          board_flop_2: null,
          board_flop_3: null,
          board_turn: null,
          board_river: null,
          created_at: Date.now(),
        },
        players: [],
        actions: [],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      const result = await handService.getHand("hand-123");

      expect(httpClient.get).toHaveBeenCalledWith("/hands/hand-123");
      expect(result).toEqual(mockResponse);
    });
  });

  describe("listHands", () => {
    it("builds correct query params with all parameters", async () => {
      const mockResponse = {
        hands: [],
        nextCursor: null,
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      await handService.listHands({
        limit: 20,
        cursor: "cursor-abc",
        minStakes: 50,
        maxStakes: 200,
        startDate: 1000000,
        endDate: 2000000,
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        "/hands?limit=20&cursor=cursor-abc&minStakes=50&maxStakes=200&startDate=1000000&endDate=2000000",
      );
    });

    it("omits undefined params from query string", async () => {
      const mockResponse = {
        hands: [],
        nextCursor: null,
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      await handService.listHands({
        limit: 20,
      });

      expect(httpClient.get).toHaveBeenCalledWith("/hands?limit=20");
    });

    it("calls endpoint without query params when params is empty", async () => {
      const mockResponse = {
        hands: [],
        nextCursor: null,
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      await handService.listHands({});

      expect(httpClient.get).toHaveBeenCalledWith("/hands");
    });

    it("excludes null values from query string", async () => {
      const mockResponse = {
        hands: [],
        nextCursor: null,
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockResponse);

      await handService.listHands({
        limit: 20,
        cursor: undefined,
        minStakes: undefined,
      });

      expect(httpClient.get).toHaveBeenCalledWith("/hands?limit=20");
    });
  });

  describe("deleteHand", () => {
    it("calls delete with correct path", async () => {
      vi.mocked(httpClient.delete).mockResolvedValue(undefined);

      await handService.deleteHand("hand-456");

      expect(httpClient.delete).toHaveBeenCalledWith("/hands/hand-456");
    });
  });
});
