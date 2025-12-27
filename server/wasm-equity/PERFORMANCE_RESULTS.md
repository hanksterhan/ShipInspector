# Rust WASM Equity Calculation Performance Results

## Summary

Performance benchmarks for the Rust WASM preflop equity calculator show that:

1. **TypeScript wrapper overhead is negligible** (~0.24%, ~50ms)
2. **The bottleneck is in the Rust WASM calculation itself**
3. Preflop calculations take **16-28 seconds** depending on the number of players
4. Performance degrades significantly with more players (more evaluations per board combination)

## Benchmark Results

### Test Scenarios

| Scenario | Players | Combinations | Time | Combos/sec | μs/combo |
|----------|---------|--------------|------|------------|----------|
| AA vs KK | 2 | 1,712,304 | ~22s | ~81,000 | 12.31μs |
| AA vs KK vs QQ | 3 | 1,370,754 | ~26s | ~52,000 | 19.09μs |
| AKs vs JJ | 2 | 1,712,304 | ~22s | ~77,000 | 12.91μs |
| 72o vs AA | 2 | 1,712,304 | ~22s | ~79,000 | 12.59μs |
| 4-way all-in | 4 | 1,086,008 | ~28s | ~38,000 | 25.99μs |
| 9-way all-in | 9 | 278,256 | ~17s | ~17,000 | 59.67μs |

### Overall Performance

- **Total combinations evaluated**: 7,871,930
- **Total time**: 135.72 seconds
- **Average time per test**: 22.62 seconds
- **Overall combinations per second**: ~58,000
- **Overall microseconds per combination**: 17.24μs

### Performance Analysis

1. **More players = slower per combination**: 
   - 2 players: ~12-13μs per combination
   - 4 players: ~26μs per combination
   - 9 players: ~60μs per combination

2. **The slowdown is expected**: With more players, each board combination requires evaluating more hands (C(7,5) = 21 evaluations per player).

3. **TypeScript is not the bottleneck**: Direct WASM calls take ~22.42s vs TypeScript wrapper taking ~22.47s (only 0.24% overhead).

## Conclusion

The 15+ second calculation time is **not caused by TypeScript or the database cache** (which we've disabled). The bottleneck is in the **pure Rust WASM implementation** itself.

### Possible Optimizations

1. **Algorithm improvements**: The current implementation evaluates all combinations sequentially. There may be opportunities for:
   - Parallelization (though WASM has limitations)
   - Better hand evaluation caching
   - Symmetry reduction

2. **Build optimizations**: The current build uses `opt-level = "z"` (optimize for size). Could try `opt-level = 3` (optimize for speed).

3. **Rust-native vs WASM**: Consider running equity calculations in a separate Rust process instead of WASM, which would allow for:
   - Better optimization
   - Native threading
   - No WASM overhead

## Running the Benchmarks

```bash
cd wasm-equity

# Full benchmark suite
node benchmark.js

# Performance comparison (WASM vs TypeScript wrapper)
node compare-performance.js
```

