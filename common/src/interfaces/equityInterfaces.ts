export interface EquityResult {
    win: number[]; // per player, fraction in [0, 1]
    tie: number[]; // per player, fraction in [0, 1]
    lose: number[]; // per player, fraction in [0, 1]
    samples: number; // number of board completions evaluated
}

export interface EquityOptions {
    mode?: "auto" | "exact" | "mc" | "rust";
    iterations?: number; // number of iterations for Monte Carlo simulation
    seed?: number; // seed for random number generator
    exactMaxCombos?: number; // guardrail: if combos > this, fallback to Monte Carlo in auto
}