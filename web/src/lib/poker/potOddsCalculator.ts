export interface PotOddsInput {
  potSize: number;
  betToCall: number;
}

export interface PotOddsResult {
  potOddsRatio: string; // e.g., "3:1"
  requiredEquity: number; // as decimal: 0.333
  requiredEquityPercent: string; // e.g., "33.3%"
  totalPot: number; // pot + bet
}

/**
 * Calculate pot odds and required equity for a given pot size and bet.
 *
 * @param input - Pot size and bet to call
 * @returns Pot odds ratio, required equity percentage, and total pot
 *
 * @example
 * calculatePotOdds({ potSize: 100, betToCall: 50 })
 * // Returns: { potOddsRatio: "2:1", requiredEquity: 0.333, requiredEquityPercent: "33.3%", totalPot: 150 }
 */
export function calculatePotOdds(input: PotOddsInput): PotOddsResult {
  const { potSize, betToCall } = input;
  const totalPot = potSize + betToCall;
  const requiredEquity = betToCall / totalPot;

  // Reward is the current pot, including the opponent’s bet, before our call.
  const ratio = potSize / betToCall;
  const potOddsRatio = `${Number(ratio.toFixed(2))}:1`;

  // Format percentage (e.g., 0.333 → "33.3%")
  const requiredEquityPercent = `${(requiredEquity * 100).toFixed(1)}%`;

  return {
    potOddsRatio,
    requiredEquity,
    requiredEquityPercent,
    totalPot,
  };
}

/**
 * Validate pot odds input values.
 *
 * @param input - Partial pot odds input to validate
 * @returns Error message if invalid, null if valid
 */
export function validatePotOddsInput(
  input: Partial<PotOddsInput>,
): string | null {
  if (input.potSize === undefined || input.potSize === null) {
    return "Pot size is required";
  }
  if (!Number.isFinite(input.potSize) || input.potSize <= 0) {
    return "Pot size must be greater than 0";
  }

  if (input.betToCall === undefined || input.betToCall === null) {
    return "Bet to call is required";
  }
  if (!Number.isFinite(input.betToCall) || input.betToCall <= 0) {
    return "Bet to call must be greater than 0";
  }

  return null;
}
