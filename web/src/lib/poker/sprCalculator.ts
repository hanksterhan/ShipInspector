export interface SPRInput {
  effectiveStack: number;
  potSize: number;
}

export interface SPRResult {
  spr: number;
}

/** Effective remaining stack divided by the pot at the start of a street. */
export function calculateSPR(input: SPRInput): SPRResult {
  return { spr: input.effectiveStack / input.potSize };
}

/**
 * Validate SPR input values.
 *
 * @param input - Partial SPR input to validate
 * @returns Error message if invalid, null if valid
 */
export function validateSPRInput(input: Partial<SPRInput>): string | null {
  if (input.effectiveStack === undefined || input.effectiveStack === null) {
    return "Effective stack is required";
  }
  if (!Number.isFinite(input.effectiveStack) || input.effectiveStack <= 0) {
    return "Effective stack must be greater than 0";
  }

  if (input.potSize === undefined || input.potSize === null) {
    return "Pot size is required";
  }
  if (!Number.isFinite(input.potSize) || input.potSize <= 0) {
    return "Pot size must be greater than 0";
  }

  return null;
}
