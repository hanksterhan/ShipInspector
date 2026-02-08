const path = require('path');
const fs = require('fs');

// Helper function to format time
function formatTime(ms) {
    if (ms < 1) {
        return `${(ms * 1000).toFixed(2)}μs`;
    } else if (ms < 1000) {
        return `${ms.toFixed(2)}ms`;
    } else {
        return `${(ms / 1000).toFixed(2)}s`;
    }
}

// Helper function to format large numbers
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Convert suit string to number
function suitToNumber(suit) {
    switch (suit) {
        case 'c': return 0;
        case 'd': return 1;
        case 'h': return 2;
        case 's': return 3;
        default: throw new Error(`Invalid suit: ${suit}`);
    }
}

// Parse card string (e.g., "14h" = Ace of hearts)
function parseCard(cardStr) {
    const rankStr = cardStr.slice(0, -1);
    const suitStr = cardStr.slice(-1);
    const rank = parseInt(rankStr, 10);
    const suit = suitToNumber(suitStr);
    return { rank, suit };
}

// Parse hole cards (e.g., "14h 14d")
function parseHole(holeStr) {
    const cards = holeStr.split(' ').map(parseCard);
    return cards;
}

// Create a full deck
function createFullDeck() {
    const deck = [];
    const suits = ['c', 'd', 'h', 's'];
    const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]; // Ace = 14
    
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ rank, suit: suitToNumber(suit) });
        }
    }
    return deck;
}

// Get remaining deck after removing known cards
function getRemainingDeck(knownCards) {
    const fullDeck = createFullDeck();
    const knownSet = new Set(knownCards.map(c => `${c.rank},${c.suit}`));
    return fullDeck.filter(c => !knownSet.has(`${c.rank},${c.suit}`));
}

// Test case structure
const testCases = [
    {
        name: 'Pocket Aces vs Pocket Kings (heads-up)',
        players: ['14h 14d', '13h 13d'],
        expectedWin: [0.806, 0.194], // Approximate
    },
    {
        name: 'Pocket Aces vs Pocket Kings vs Pocket Queens (3-way)',
        players: ['14h 14d', '13h 13d', '12h 12d'],
        expectedWin: [0.677, 0.222, 0.101], // Approximate
    },
    {
        name: 'AK suited vs Pocket Jacks (heads-up)',
        players: ['14h 13h', '11h 11d'],
        expectedWin: [0.465, 0.535], // Approximate
    },
    {
        name: '72 offsuit vs Pocket Aces (worst vs best)',
        players: ['7c 2d', '14h 14d'],
        expectedWin: [0.122, 0.878], // Approximate
    },
    {
        name: 'Four-way all-in (4 players)',
        players: ['14h 14d', '13h 13d', '12h 12d', '11h 11d'],
        expectedWin: [0.502, 0.253, 0.152, 0.093], // Approximate
    },
    {
        name: 'Nine-way all-in (9 players)',
        players: [
            '14h 14d', // AA
            '13h 13d', // KK
            '12h 12d', // QQ
            '11h 11d', // JJ
            '10h 10d', // TT
            '9h 9d',   // 99
            '8h 8d',   // 88
            '7h 7d',   // 77
            '6h 6d',   // 66
        ],
    },
];

async function runBenchmark() {
    console.log('🚀 Rust WASM Equity Calculation Benchmark\n');
    console.log('='.repeat(80));
    
    // Load WASM module
    const wasmPath = path.join(__dirname, 'pkg', 'wasm_equity.js');
    if (!fs.existsSync(wasmPath)) {
        console.error(`❌ WASM module not found at ${wasmPath}`);
        console.error('Please run: cd wasm-equity && wasm-pack build --target nodejs --out-dir pkg');
        process.exit(1);
    }
    
    console.log('📦 Loading WASM module...');
    const wasmInit = require(wasmPath);
    const wasmModule = wasmInit.default ? await wasmInit.default() : wasmInit;
    console.log('✅ WASM module loaded successfully\n');
    
    let totalTime = 0;
    let totalCombos = 0;
    
    // Run each test case
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`\n${'─'.repeat(80)}`);
        console.log(`Test ${i + 1}/${testCases.length}: ${testCase.name}`);
        console.log('─'.repeat(80));
        
        // Parse players
        const players = testCase.players.map(parseHole);
        console.log(`Players: ${testCase.players.join(' vs ')}`);
        
        // Collect all known cards
        const knownCards = [];
        for (const hole of players) {
            knownCards.push(...hole);
        }
        
        // Get remaining deck
        const remainingDeck = getRemainingDeck(knownCards);
        console.log(`Remaining deck: ${remainingDeck.length} cards`);
        
        // Prepare data arrays
        const playerRanks = [];
        const playerSuits = [];
        
        for (const hole of players) {
            for (const card of hole) {
                playerRanks.push(card.rank);
                playerSuits.push(card.suit);
            }
        }
        
        const deckRanks = remainingDeck.map(c => c.rank);
        const deckSuits = remainingDeck.map(c => c.suit);
        
        const numPlayers = players.length;
        const missing = 5; // Preflop = 5 cards missing
        
        // Calculate total combinations
        const combos = combinationCount(remainingDeck.length, missing);
        console.log(`Total combinations: ${formatNumber(combos)}`);
        
        // Warm-up run (WASM often needs a warm-up)
        console.log('🔥 Warm-up run...');
        const warmupStart = performance.now();
        wasmModule.calculate_preflop_equity(
            new Uint8Array(playerRanks),
            new Uint8Array(playerSuits),
            new Uint8Array(deckRanks),
            new Uint8Array(deckSuits),
            numPlayers,
            missing
        );
        const warmupTime = performance.now() - warmupStart;
        console.log(`   Warm-up time: ${formatTime(warmupTime)}`);
        
        // Actual benchmark
        console.log('⏱️  Running benchmark...');
        const start = performance.now();
        const resultJson = wasmModule.calculate_preflop_equity(
            new Uint8Array(playerRanks),
            new Uint8Array(playerSuits),
            new Uint8Array(deckRanks),
            new Uint8Array(deckSuits),
            numPlayers,
            missing
        );
        const end = performance.now();
        const elapsed = end - start;
        
        totalTime += elapsed;
        totalCombos += combos;
        
        // Parse results
        const result = JSON.parse(resultJson);
        
        // Display results
        console.log(`\n⏱️  Calculation time: ${formatTime(elapsed)}`);
        console.log(`📊 Combinations per second: ${formatNumber(Math.round(combos / (elapsed / 1000)))}`);
        console.log(`📊 Microseconds per combination: ${((elapsed * 1000) / combos).toFixed(2)}μs`);
        
        console.log('\n📈 Equity Results:');
        for (let p = 0; p < numPlayers; p++) {
            const win = (result.win[p] * 100).toFixed(2);
            const tie = (result.tie[p] * 100).toFixed(2);
            const lose = (result.lose[p] * 100).toFixed(2);
            
            let expected = '';
            if (testCase.expectedWin && testCase.expectedWin[p]) {
                const expectedPct = (testCase.expectedWin[p] * 100).toFixed(2);
                const diff = Math.abs(result.win[p] - testCase.expectedWin[p]) * 100;
                expected = ` (expected: ${expectedPct}%, diff: ${diff.toFixed(2)}%)`;
            }
            
            console.log(`   Player ${p + 1} (${testCase.players[p]}):`);
            console.log(`      Win:  ${win}%${expected}`);
            console.log(`      Tie:  ${tie}%`);
            console.log(`      Lose: ${lose}%`);
        }
        
        console.log(`\n✅ Samples evaluated: ${formatNumber(result.samples)}`);
        
        // Verify samples match expected combinations
        if (result.samples !== combos) {
            console.warn(`⚠️  Warning: Samples (${result.samples}) != expected combinations (${combos})`);
        }
    }
    
    // Summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 BENCHMARK SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total test cases: ${testCases.length}`);
    console.log(`Total combinations evaluated: ${formatNumber(totalCombos)}`);
    console.log(`Total time: ${formatTime(totalTime)}`);
    console.log(`Average time per test: ${formatTime(totalTime / testCases.length)}`);
    console.log(`Overall combinations per second: ${formatNumber(Math.round(totalCombos / (totalTime / 1000)))}`);
    console.log(`Overall microseconds per combination: ${((totalTime * 1000) / totalCombos).toFixed(2)}μs`);
    console.log('='.repeat(80));
}

// Calculate nCk (combinations)
function combinationCount(n, k) {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;
    
    let result = 1;
    for (let i = 0; i < k; i++) {
        result = (result * (n - i)) / (i + 1);
    }
    return Math.round(result);
}

// Run the benchmark
runBenchmark().catch(error => {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
});

