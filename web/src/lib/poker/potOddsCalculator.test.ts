import { describe, it, expect } from "vitest";
import {
  calculatePotOdds,
  validatePotOddsInput,
  type PotOddsInput,
} from "./potOddsCalculator";

describe("calculatePotOdds", () => {
  it("calculates pot odds correctly for pot $100, bet $50", () => {
    const input: PotOddsInput = { potSize: 100, betToCall: 50 };
    const result = calculatePotOdds(input);

    expect(result.potOddsRatio).toBe("3:1");
    expect(result.requiredEquityPercent).toBe("33.3%");
    expect(result.requiredEquity).toBeCloseTo(0.333, 3);
    expect(result.totalPot).toBe(150);
  });

  it("calculates pot odds correctly for pot $200, bet $100", () => {
    const input: PotOddsInput = { potSize: 200, betToCall: 100 };
    const result = calculatePotOdds(input);

    expect(result.potOddsRatio).toBe("3:1");
    expect(result.requiredEquityPercent).toBe("33.3%");
    expect(result.requiredEquity).toBeCloseTo(0.333, 3);
    expect(result.totalPot).toBe(300);
  });

  it("calculates pot odds correctly for pot $100, bet $25", () => {
    const input: PotOddsInput = { potSize: 100, betToCall: 25 };
    const result = calculatePotOdds(input);

    expect(result.potOddsRatio).toBe("5:1");
    expect(result.requiredEquityPercent).toBe("20.0%");
    expect(result.requiredEquity).toBe(0.2);
    expect(result.totalPot).toBe(125);
  });

  it("calculates pot odds correctly for pot $50, bet $50", () => {
    const input: PotOddsInput = { potSize: 50, betToCall: 50 };
    const result = calculatePotOdds(input);

    expect(result.potOddsRatio).toBe("2:1");
    expect(result.requiredEquityPercent).toBe("50.0%");
    expect(result.requiredEquity).toBe(0.5);
    expect(result.totalPot).toBe(100);
  });

  it("handles decimal values", () => {
    const input: PotOddsInput = { potSize: 75.5, betToCall: 25.25 };
    const result = calculatePotOdds(input);

    expect(result.potOddsRatio).toBe("4:1"); // 100.75 / 25.25 ≈ 4
    expect(result.requiredEquity).toBeCloseTo(0.2507, 2);
    expect(result.totalPot).toBeCloseTo(100.75, 2);
  });

  it("handles very small bet relative to pot", () => {
    const input: PotOddsInput = { potSize: 1000, betToCall: 10 };
    const result = calculatePotOdds(input);

    expect(result.potOddsRatio).toBe("101:1");
    expect(result.requiredEquity).toBeCloseTo(0.0099, 4);
    expect(result.totalPot).toBe(1010);
  });
});

describe("validatePotOddsInput", () => {
  it("returns null for valid inputs", () => {
    const input: PotOddsInput = { potSize: 100, betToCall: 50 };
    expect(validatePotOddsInput(input)).toBeNull();
  });

  it("rejects zero pot size", () => {
    const input: Partial<PotOddsInput> = { potSize: 0, betToCall: 50 };
    expect(validatePotOddsInput(input)).toBe(
      "Pot size must be greater than 0",
    );
  });

  it("rejects negative pot size", () => {
    const input: Partial<PotOddsInput> = { potSize: -100, betToCall: 50 };
    expect(validatePotOddsInput(input)).toBe(
      "Pot size must be greater than 0",
    );
  });

  it("rejects zero bet to call", () => {
    const input: Partial<PotOddsInput> = { potSize: 100, betToCall: 0 };
    expect(validatePotOddsInput(input)).toBe(
      "Bet to call must be greater than 0",
    );
  });

  it("rejects negative bet to call", () => {
    const input: Partial<PotOddsInput> = { potSize: 100, betToCall: -50 };
    expect(validatePotOddsInput(input)).toBe(
      "Bet to call must be greater than 0",
    );
  });

  it("rejects missing pot size", () => {
    const input: Partial<PotOddsInput> = { betToCall: 50 };
    expect(validatePotOddsInput(input)).toBe("Pot size is required");
  });

  it("rejects missing bet to call", () => {
    const input: Partial<PotOddsInput> = { potSize: 100 };
    expect(validatePotOddsInput(input)).toBe("Bet to call is required");
  });

  it("accepts decimal values", () => {
    const input: PotOddsInput = { potSize: 100.5, betToCall: 50.25 };
    expect(validatePotOddsInput(input)).toBeNull();
  });
});
