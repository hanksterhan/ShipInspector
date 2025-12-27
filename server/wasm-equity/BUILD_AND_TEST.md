# Building and Testing the Optimized Rust WASM Module

## Prerequisites

1. **Rust** installed: https://rustup.rs/
2. **wasm-pack** installed: `cargo install wasm-pack`
3. **wasm32 target** installed: `rustup target add wasm32-unknown-unknown`

## Building

From the `server/wasm-equity` directory:

```bash
wasm-pack build --target nodejs --out-dir pkg --release
```

Or use the npm script from the server directory:

```bash
cd server
npm run build:wasm
```

## Expected Build Output

The build will generate files in `pkg/`:
- `wasm_equity.js` - JavaScript bindings
- `wasm_equity_bg.wasm` - Compiled WASM binary
- `wasm_equity.d.ts` - TypeScript definitions

## Running Benchmarks

### Full Benchmark Suite

Tests multiple scenarios (2-9 players):

```bash
cd wasm-equity
node benchmark.js
```

**Expected results after optimization:**
- 2-player: ~150-300ms (was 22s)
- 4-player: ~200-400ms (was 28s)
- 9-player: ~100-200ms (was 17s)

### Performance Comparison

Compares direct WASM vs TypeScript wrapper overhead:

```bash
node compare-performance.js
```

Should show TypeScript overhead is negligible (<1% of total time).

## Integration Testing

To test with the actual server:

1. Build the WASM module
2. Build the server: `cd server && npm run build`
3. Start the server: `npm start`
4. Make equity calculation requests via API

## Troubleshooting

### Build fails with "command not found: wasm-pack"

Install wasm-pack:
```bash
cargo install wasm-pack
```

### Build fails with "target not found: wasm32-unknown-unknown"

Install the target:
```bash
rustup target add wasm32-unknown-unknown
```

### Runtime error: "WASM module not found"

Ensure you've built the module and the `pkg/` directory exists with the generated files.

### Performance is still slow

1. Verify you're using `--release` flag (optimizations enabled)
2. Check `Cargo.toml` has `opt-level = 3` in `[profile.release]`
3. Clear and rebuild: `cargo clean && wasm-pack build --target nodejs --out-dir pkg --release`

## Performance Expectations

### Before Optimizations
- 2-player preflop: ~22 seconds
- 4-player preflop: ~28 seconds
- 9-player preflop: ~17 seconds
- Overall: ~17-28μs per combination

### After Optimizations (Target)
- 2-player preflop: ~150ms
- 4-player preflop: ~200-400ms
- 9-player preflop: ~100-200ms
- Overall: ~0.1-0.2μs per combination

This represents a **100-150x speedup** through:
- Integer-based hand encoding (no allocations)
- Fixed-size arrays (stack-only)
- Aggressive compiler optimizations
- Function inlining
- Direct integer comparisons

