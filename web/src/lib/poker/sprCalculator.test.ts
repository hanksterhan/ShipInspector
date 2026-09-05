import { describe, it, expect } from "vitest";
import { calculateSPR, validateSPRInput, type SPRInput } from "./sprCalculator";

describe("calculateSPR", () => {
  it("calculates SPR correctly for stack 100, pot 20", () => {
    const input: SPRInput = { effectiveStack: 100, potSize: 20 };
    const result = calculateSPR(input);
    expect(result.spr).toBe(5);
  });

  it("calculates a ratio of 200", () => {
    const input: SPRInput = { effectiveStack: 1000, potSize: 5 };
    const result = calculateSPR(input);
    expect(result.spr).toBe(200);
  });

  it("calculates a ratio of 62.5", () => {
    const input: SPRInput = { effectiveStack: 500, potSize: 8 };
    const result = calculateSPR(input);
    expect(result.spr).toBe(62.5);
  });

  it("calculates a ratio of 25", () => {
    const input: SPRInput = { effectiveStack: 200, potSize: 8 };
    const result = calculateSPR(input);
    expect(result.spr).toBe(25);
  });

  it("calculates a ratio of 10 without inferring an action", () => {
    const input: SPRInput = { effectiveStack: 100, potSize: 10 };
    const result = calculateSPR(input);
    expect(result.spr).toBe(10);
  });

  it("handles decimal values", () => {
    const input: SPRInput = { effectiveStack: 150.5, potSize: 25.25 };
    const result = calculateSPR(input);
    expect(result.spr).toBeCloseTo(5.96, 2);
  });
});

describe("validateSPRInput", () => {
  it("returns null for valid inputs", () => {
    const input: SPRInput = { effectiveStack: 100, potSize: 20 };
    expect(validateSPRInput(input)).toBeNull();
  });

  it("rejects zero effective stack", () => {
    expect(validateSPRInput({ effectiveStack: 0, potSize: 20 })).toBe(
      "Effective stack must be greater than 0",
    );
  });

  it("rejects negative pot size", () => {
    expect(validateSPRInput({ effectiveStack: 100, potSize: -10 })).toBe(
      "Pot size must be greater than 0",
    );
  });

  it("rejects missing effective stack", () => {
    expect(validateSPRInput({ potSize: 20 })).toBe(
      "Effective stack is required",
    );
  });

  it("rejects missing pot size", () => {
    expect(validateSPRInput({ effectiveStack: 100 })).toBe(
      "Pot size is required",
    );
  });
});
