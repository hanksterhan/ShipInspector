import { describe, it, expect } from "vitest";
import type { CalculateEquityResponse } from "@common/interfaces";

describe("@common/interfaces alias", () => {
  it("resolves the type correctly", () => {
    const mockResponse: CalculateEquityResponse = {
      equity: { win: [500, 500], tie: [0, 0], lose: [500, 500], samples: 1000 },
      players: [],
      board: [],
      dead: [],
    };
    expect(mockResponse.equity.win).toHaveLength(2);
  });
});
