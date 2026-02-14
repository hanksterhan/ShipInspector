export interface SPRInput {
  effectiveStack: number;
  potSize: number;
}

export type SPRStrategy =
  | "deep-stacked"
  | "balanced"
  | "value-focused"
  | "push-fold";

export interface SPRResult {
  spr: number;
  strategy: SPRStrategy;
  strategyDescription: string;
}

/**
 * Calculate SPR (Stack-to-Pot Ratio) and provide strategy guidance.
 *
 * @param input - Effective stack and pot size
 * @returns SPR ratio, strategy category, and description
 */
export function calculateSPR(input: SPRInput): SPRResult {
  const { effectiveStack, potSize } = input;
  const spr = effectiveStack / potSize;

  let strategy: SPRStrategy;
  let strategyDescription: string;

  if (spr > 100) {
    strategy = "deep-stacked";
    strategyDescription =
      "Deep stacked: Play wider ranges, set mining profitable, speculative hands have value";
  } else if (spr >= 50) {
    strategy = "balanced";
    strategyDescription =
      "Balanced stack depth: Play balanced ranges, mix of value and speculative hands";
  } else if (spr >= 20) {
    strategy = "value-focused";
    strategyDescription =
      "Value-focused: Tighten ranges, prioritize strong hands, reduce speculation";
  } else {
    strategy = "push-fold";
    strategyDescription =
      "Push-fold territory: Commit or fold decisions, narrow ranges, high variance";
  }

  return {
    spr,
    strategy,
    strategyDescription,
  };
}

/**
 * Validate SPR input values.
 *
 * @param input - Partial SPR input to validate
 * @returns Error message if invalid, null if valid
 */
export function validateSPRInput(input: Partial<SPRInput>): string | null {
  if (
    input.effectiveStack === undefined ||
    input.effectiveStack === null
  ) {
    return "Effective stack is required";
  }
  if (input.effectiveStack <= 0) {
    return "Effective stack must be greater than 0";
  }

  if (input.potSize === undefined || input.potSize === null) {
    return "Pot size is required";
  }
  if (input.potSize <= 0) {
    return "Pot size must be greater than 0";
  }

  return null;
}
