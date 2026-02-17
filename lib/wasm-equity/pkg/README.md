# WASM Equity Calculator

This Rust WASM module provides preflop equity calculation using exact enumeration for optimal performance.

## Building

To build the WASM module, you need:
1. Rust installed (https://rustup.rs/)
2. wasm-pack installed: `cargo install wasm-pack`

Then run:
```bash
cd wasm-equity
wasm-pack build --target nodejs --out-dir pkg
```

This will generate the WASM module in the `pkg` directory, which will be loaded by the Node.js server.

## Usage

The module exports a single function `calculate_preflop_equity` that takes:
- `player_ranks`: Uint8Array of card ranks (2-14, Ace=14) for all player cards
- `player_suits`: Uint8Array of card suits (0=c, 1=d, 2=h, 3=s) for all player cards
- `deck_ranks`: Uint8Array of ranks for remaining deck cards
- `deck_suits`: Uint8Array of suits for remaining deck cards
- `num_players`: number of players
- `missing`: number of cards missing from board (should be 5 for preflop)

Returns a JSON string with equity results:
```json
{"win":[0.5,0.5],"tie":[0,0],"lose":[0.5,0.5],"samples":1712304}
```

## Performance

This implementation uses exact enumeration optimized for preflop scenarios. It's designed for simplicity and efficiency, trading some optimization for code clarity.

### Benchmarking

Run the performance benchmarks to test calculation speed:

```bash
# Full benchmark suite with multiple test scenarios
node benchmark.js

# Compare direct WASM vs TypeScript wrapper overhead
node compare-performance.js
```

See `PERFORMANCE_RESULTS.md` for detailed benchmark results.

**Note**: Previous performance was ~22 seconds for a 2-player preflop calculation (1.7M combinations). After optimizations, target performance is **~150ms** (100x speedup).

See `OPTIMIZATIONS.md` for detailed information about all optimizations applied.

