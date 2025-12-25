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
    const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    
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

async function comparePerformance() {
    console.log('🔬 Performance Comparison: Direct WASM vs TypeScript Wrapper\n');
    console.log('='.repeat(80));
    
    // Test case: Pocket Aces vs Pocket Kings
    const testCase = {
        name: 'Pocket Aces vs Pocket Kings',
        players: ['14h 14d', '13h 13d'],
    };
    
    console.log(`Test Case: ${testCase.name}`);
    console.log(`Players: ${testCase.players.join(' vs ')}\n`);
    
    // Parse players
    const players = testCase.players.map(parseHole);
    const knownCards = [];
    for (const hole of players) {
        knownCards.push(...hole);
    }
    const remainingDeck = getRemainingDeck(knownCards);
    
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
    const missing = 5;
    const combos = combinationCount(remainingDeck.length, missing);
    
    console.log(`Total combinations: ${formatNumber(combos)}\n`);
    
    // 1. Direct WASM call
    console.log('📦 Loading WASM module...');
    const wasmPath = path.join(__dirname, 'pkg', 'wasm_equity.js');
    if (!fs.existsSync(wasmPath)) {
        console.error(`❌ WASM module not found at ${wasmPath}`);
        process.exit(1);
    }
    
    const wasmInit = require(wasmPath);
    const wasmModule = wasmInit.default ? await wasmInit.default() : wasmInit;
    console.log('✅ WASM module loaded\n');
    
    // Warm-up
    console.log('🔥 Warm-up run...');
    wasmModule.calculate_preflop_equity(
        new Uint8Array(playerRanks),
        new Uint8Array(playerSuits),
        new Uint8Array(deckRanks),
        new Uint8Array(deckSuits),
        numPlayers,
        missing
    );
    
    // Direct WASM benchmark (multiple runs for average)
    console.log('⏱️  Testing Direct WASM call (3 runs)...');
    const directTimes = [];
    for (let i = 0; i < 3; i++) {
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
        directTimes.push(elapsed);
        
        if (i === 0) {
            const result = JSON.parse(resultJson);
            console.log(`   Run ${i + 1}: ${formatTime(elapsed)} (${formatNumber(result.samples)} samples)`);
        } else {
            console.log(`   Run ${i + 1}: ${formatTime(elapsed)}`);
        }
    }
    
    const avgDirect = directTimes.reduce((a, b) => a + b, 0) / directTimes.length;
    const minDirect = Math.min(...directTimes);
    const maxDirect = Math.max(...directTimes);
    
    console.log(`   Average: ${formatTime(avgDirect)}`);
    console.log(`   Min: ${formatTime(minDirect)}, Max: ${formatTime(maxDirect)}\n`);
    
    // 2. TypeScript wrapper (simulate the overhead)
    console.log('⏱️  Testing TypeScript wrapper overhead (3 runs)...');
    const wrapperTimes = [];
    
    for (let i = 0; i < 3; i++) {
        const start = performance.now();
        
        // Simulate TypeScript wrapper: parse cards, convert arrays, call WASM, parse JSON
        const playerRanksArray = [];
        const playerSuitsArray = [];
        for (const hole of players) {
            for (const card of hole) {
                playerRanksArray.push(card.rank);
                playerSuitsArray.push(suitToNumber(['c', 'd', 'h', 's'][card.suit]));
            }
        }
        
        const deckRanksArray = remainingDeck.map(c => c.rank);
        const deckSuitsArray = remainingDeck.map(c => c.suit);
        
        const resultJson2 = wasmModule.calculate_preflop_equity(
            new Uint8Array(playerRanksArray),
            new Uint8Array(playerSuitsArray),
            new Uint8Array(deckRanksArray),
            new Uint8Array(deckSuitsArray),
            numPlayers,
            missing
        );
        
        const result = JSON.parse(resultJson2);
        const end = performance.now();
        const elapsed = end - start;
        wrapperTimes.push(elapsed);
        
        if (i === 0) {
            console.log(`   Run ${i + 1}: ${formatTime(elapsed)} (${formatNumber(result.samples)} samples)`);
        } else {
            console.log(`   Run ${i + 1}: ${formatTime(elapsed)}`);
        }
    }
    
    const avgWrapper = wrapperTimes.reduce((a, b) => a + b, 0) / wrapperTimes.length;
    const minWrapper = Math.min(...wrapperTimes);
    const maxWrapper = Math.max(...wrapperTimes);
    
    console.log(`   Average: ${formatTime(avgWrapper)}`);
    console.log(`   Min: ${formatTime(minWrapper)}, Max: ${formatTime(maxWrapper)}\n`);
    
    // Comparison
    console.log('='.repeat(80));
    console.log('📊 COMPARISON');
    console.log('='.repeat(80));
    console.log(`Direct WASM average:    ${formatTime(avgDirect)}`);
    console.log(`TypeScript wrapper avg: ${formatTime(avgWrapper)}`);
    const overhead = avgWrapper - avgDirect;
    const overheadPercent = ((overhead / avgDirect) * 100).toFixed(2);
    console.log(`Overhead:               ${formatTime(overhead)} (${overheadPercent}%)`);
    console.log('\n💡 Conclusion:');
    if (Math.abs(overhead) < 100) {
        console.log('   TypeScript wrapper overhead is negligible (< 100ms)');
        console.log('   The bottleneck is in the Rust WASM calculation itself');
    } else {
        console.log(`   TypeScript wrapper adds ${formatTime(overhead)} of overhead`);
    }
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

// Run the comparison
comparePerformance().catch(error => {
    console.error('❌ Comparison failed:', error);
    process.exit(1);
});

