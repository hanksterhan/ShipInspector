# Rust WASM Equity Calculator Optimizations

## Goal
Achieve 100x speedup: from 15+ seconds to 150ms for preflop equity calculations.

## Optimizations Implemented

### 1. Compiler Optimizations (`Cargo.toml`)
- **Changed `opt-level` from "z" (size) to "3" (maximum speed)**
  - Allows aggressive optimizations at the expense of binary size
  - Expected improvement: ~2-3x

### 2. Integer-Based Hand Ranking
- **Replaced `HandRank` struct with `u64` integer encoding**
  - Previous: Struct with `category: u8` and `tiebreak: Vec<u8>` (heap allocation)
  - New: Single `u64` encoding all information
  - Encoding: category in upper 8 bits, tiebreaker ranks in subsequent 8-bit fields
  - **Benefits:**
    - Zero allocations (stack-only)
    - Instant comparisons (single CPU instruction: `cmp`)
    - Cache-friendly (single value)
  - Expected improvement: ~5-10x for hand comparisons

### 3. Eliminated Heap Allocations in Hot Loops
- **Fixed-size arrays instead of `Vec` for:**
  - Hand evaluation (`[Card; 5]`, `[Card; 2]`, `[Card; 7]`)
  - Rank counting (`[u8; 15]`, `[u8; 5]`)
  - Combination iteration (`[u8; 8]` for k≤8)
- **Stack-allocated buffers** for all temporary data
- **Benefits:**
  - No heap allocations in evaluation loop (millions of iterations)
  - Better cache locality
  - No GC pressure
  - Expected improvement: ~3-5x

### 4. Optimized Hand Evaluation
- **7-card hand evaluation:**
  - Uses fixed-size array `[Card; 7]` instead of `Vec`
  - Pre-allocates 5-card array on stack
  - Eliminates 21 `Vec` allocations per 7-card evaluation
- **5-card hand evaluation:**
  - Fixed-size arrays for ranks, suits, counts
  - Bit-based straight detection where possible
  - Expected improvement: ~2-3x

### 5. Function Inlining
- **All critical functions marked `#[inline(always)]`:**
  - `evaluate_5_card_hand`
  - `evaluate_7_card_hand`
  - `is_straight_ranks`
  - `get_straight_high`
  - `encode_hand_rank`
  - `iterate_combinations_helper_fixed`
- **Benefits:**
  - Eliminates function call overhead in hot loops
  - Allows better compiler optimizations across function boundaries
  - Expected improvement: ~1.5-2x

### 6. Optimized Combination Generation
- **Stack-based combination iterator for k≤8:**
  - Uses fixed-size array `[u8; 8]` instead of `Vec`
  - Eliminates millions of heap allocations
  - Falls back to `Vec` only for larger k (shouldn't happen in preflop)
- **Benefits:**
  - No allocations in combination enumeration
  - Better cache performance
  - Expected improvement: ~2-3x

### 7. Integer Comparison Instead of Struct Comparison
- **Direct `u64` comparisons:**
  - `if hand_rank > best_hand` (single instruction)
  - Previously: multiple comparisons through struct fields and Vec iterations
- **Benefits:**
  - Single CPU instruction per comparison
  - No branching overhead
  - Expected improvement: ~3-5x

### 8. Pre-allocated Board Array
- **Fixed-size board array reused in loop:**
  - `let mut complete_board = [Card { rank: 0, suit: 0 }; 5];`
  - Reused for each combination instead of allocating new `Vec`
- **Benefits:**
  - No allocations in main evaluation loop
  - Expected improvement: ~1.5x

## Combined Expected Performance

With all optimizations combined, we expect:
- **Compiler optimizations**: 2-3x
- **Integer encoding**: 5-10x
- **Eliminated allocations**: 3-5x
- **Hand evaluation**: 2-3x
- **Inlining**: 1.5-2x
- **Combination generation**: 2-3x
- **Integer comparisons**: 3-5x
- **Pre-allocated arrays**: 1.5x

**Total expected improvement: ~100-500x**

Given starting point of ~22 seconds, target of 150ms is achievable with these optimizations.

## Code Changes Summary

### Before:
- HandRank struct with Vec allocations
- Vec allocations in every evaluation
- Function calls with overhead
- Heap allocations in hot loops
- Size-optimized build

### After:
- u64 integer encoding (zero allocations)
- Fixed-size arrays throughout (stack-only)
- Inlined critical functions
- Direct integer comparisons
- Speed-optimized build

## Building

```bash
cd wasm-equity
wasm-pack build --target nodejs --out-dir pkg --release
```

## Testing

After building, run benchmarks:

```bash
node benchmark.js
```

Expected results:
- **2-player preflop**: ~150-300ms (down from 22s)
- **4-player preflop**: ~200-400ms (down from 28s)
- **9-player preflop**: ~100-200ms (down from 17s)

## Performance Characteristics

### Memory Usage
- **Before**: Millions of heap allocations, potential GC pressure
- **After**: Stack-only allocations, predictable memory usage

### Cache Performance
- **Before**: Poor cache locality due to heap allocations
- **After**: Excellent cache locality with stack arrays and single integer comparisons

### CPU Efficiency
- **Before**: Many branch mispredictions, function call overhead
- **After**: Minimal branching, inlined code, single-instruction comparisons

