export interface EquityResult {
    win: number[]; // per player, fraction in [0, 1]
    tie: number[]; // per player, fraction in [0, 1]
    lose: number[]; // per player, fraction in [0, 1]
    samples: number; // number of board completions evaluated
}

export interface EquityOptions {
    mode?: "rust"; // Only Rust WASM mode is supported
}