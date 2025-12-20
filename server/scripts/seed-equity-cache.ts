/**
 * Seed the equity cache database with common pre-flop heads-up matchups
 *
 * This script pre-computes equity for hundreds of common pre-flop scenarios
 * to warm up the cache and provide instant results for popular matchups.
 *
 * Usage: npm run seed:equity-cache
 */

import { Hole, Board } from "@common/interfaces";
import { computeEquity } from "../src/integrations/hand/equity";
import db from "../src/config/database";
import { createEquityKey } from "../src/integrations/hand/equityLookup";

/**
 * Generate all 169 unique starting hands
 */
function generateAllStartingHands(): Array<{ name: string; hole: Hole }> {
    const hands: Array<{ name: string; hole: Hole }> = [];
    const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]; // 2-A

    // Pocket pairs (13 hands)
    for (const rank of ranks) {
        hands.push({
            name: `${rank === 14 ? "A" : rank === 13 ? "K" : rank === 12 ? "Q" : rank === 11 ? "J" : rank}${rank === 14 ? "A" : rank === 13 ? "K" : rank === 12 ? "Q" : rank === 11 ? "J" : rank}`,
            hole: {
                cards: [
                    { rank: rank as any, suit: "h" },
                    { rank: rank as any, suit: "d" },
                ],
            },
        });
    }

    // Suited hands (78 hands)
    for (let i = 0; i < ranks.length; i++) {
        for (let j = i + 1; j < ranks.length; j++) {
            const rank1 = ranks[i];
            const rank2 = ranks[j];
            const rank1Str =
                rank1 === 14
                    ? "A"
                    : rank1 === 13
                      ? "K"
                      : rank1 === 12
                        ? "Q"
                        : rank1 === 11
                          ? "J"
                          : rank1.toString();
            const rank2Str =
                rank2 === 14
                    ? "A"
                    : rank2 === 13
                      ? "K"
                      : rank2 === 12
                        ? "Q"
                        : rank2 === 11
                          ? "J"
                          : rank2.toString();
            hands.push({
                name: `${rank1Str}${rank2Str}s`,
                hole: {
                    cards: [
                        { rank: rank1 as any, suit: "h" },
                        { rank: rank2 as any, suit: "h" },
                    ],
                },
            });
        }
    }

    // Offsuit hands (78 hands)
    for (let i = 0; i < ranks.length; i++) {
        for (let j = i + 1; j < ranks.length; j++) {
            const rank1 = ranks[i];
            const rank2 = ranks[j];
            const rank1Str =
                rank1 === 14
                    ? "A"
                    : rank1 === 13
                      ? "K"
                      : rank1 === 12
                        ? "Q"
                        : rank1 === 11
                          ? "J"
                          : rank1.toString();
            const rank2Str =
                rank2 === 14
                    ? "A"
                    : rank2 === 13
                      ? "K"
                      : rank2 === 12
                        ? "Q"
                        : rank2 === 11
                          ? "J"
                          : rank2.toString();
            hands.push({
                name: `${rank1Str}${rank2Str}o`,
                hole: {
                    cards: [
                        { rank: rank1 as any, suit: "h" },
                        { rank: rank2 as any, suit: "d" },
                    ],
                },
            });
        }
    }

    return hands;
}

/**
 * Get top N most important starting hands for seeding
 */
function getTopHands(count: number = 50): Array<{ name: string; hole: Hole }> {
    const allHands = generateAllStartingHands();

    // Priority order: premium hands first
    const priorityOrder = [
        // Pocket pairs (high to low)
        "AA",
        "KK",
        "QQ",
        "JJ",
        "TT",
        "99",
        "88",
        "77",
        "66",
        "55",
        "44",
        "33",
        "22",
        // Premium suited
        "AKs",
        "AQs",
        "AJs",
        "KQs",
        "KJs",
        "QJs",
        "ATs",
        "KTs",
        "QTs",
        "JTs",
        "A9s",
        "K9s",
        "Q9s",
        "J9s",
        "T9s",
        "98s",
        "A8s",
        "K8s",
        "Q8s",
        "J8s",
        "T8s",
        "87s",
        "A7s",
        "K7s",
        "Q7s",
        "J7s",
        "T7s",
        "97s",
        "76s",
        // Premium offsuit
        "AKo",
        "AQo",
        "AJo",
        "KQo",
        "KJo",
        "QJo",
        "ATo",
        "KTo",
        "QTo",
        "JTo",
    ];

    // Create a map for quick lookup
    const handMap = new Map(
        allHands.map((h) => [h.name, h])
    );

    const topHands: Array<{ name: string; hole: Hole }> = [];

    // Add hands in priority order
    for (const name of priorityOrder) {
        const hand = handMap.get(name);
        if (hand && topHands.length < count) {
            topHands.push(hand);
        }
    }

    // Fill remaining slots with other hands
    for (const hand of allHands) {
        if (topHands.length >= count) break;
        if (!topHands.some((h) => h.name === hand.name)) {
            topHands.push(hand);
        }
    }

    return topHands.slice(0, count);
}

/**
 * Store equity result in database
 */
function storeEquity(
    players: readonly Hole[],
    board: Board,
    dead: readonly any[],
    result: any,
    options: any
): void {
    const key = createEquityKey(players, board, dead, options);
    const now = Date.now();

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO equity_cache 
        (key, win, tie, lose, samples, created_at, last_accessed, access_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `);

    stmt.run(
        key,
        JSON.stringify(result.win),
        JSON.stringify(result.tie),
        JSON.stringify(result.lose),
        result.samples,
        now,
        now
    );
}

/**
 * Main seeding function
 */
async function seedEquityCache(): Promise<void> {
    console.log("🎲 Starting equity cache seeding...\n");

    // Get top hands (adjust count as needed)
    const topHands = getTopHands(50);
    console.log(`📊 Selected ${topHands.length} top starting hands\n`);

    // Generate all unique matchups (avoid duplicates)
    const matchups: Array<{
        hand1: { name: string; hole: Hole };
        hand2: { name: string; hole: Hole };
    }> = [];

    for (let i = 0; i < topHands.length; i++) {
        for (let j = i + 1; j < topHands.length; j++) {
            matchups.push({
                hand1: topHands[i],
                hand2: topHands[j],
            });
        }
    }

    console.log(`🔄 Generating ${matchups.length} unique matchups...\n`);

    const total = matchups.length;
    let processed = 0;
    let cached = 0;
    let computed = 0;
    const startTime = Date.now();

    // Process each matchup
    for (const matchup of matchups) {
        processed++;

        // Check if already cached
        const key = createEquityKey(
            [matchup.hand1.hole, matchup.hand2.hole],
            { cards: [] },
            [],
            { mode: "exact" }
        );

        const existing = db
            .prepare("SELECT key FROM equity_cache WHERE key = ?")
            .get(key);

        if (existing) {
            cached++;
            if (processed % 10 === 0 || processed === total) {
                console.log(
                    `[${processed}/${total}] ⏭️  ${matchup.hand1.name} vs ${matchup.hand2.name} (cached) | Total: ${processed}/${total} | Cached: ${cached} | Computed: ${computed}`
                );
            }
            continue;
        }

        // Compute equity
        try {
            const result = computeEquity(
                [matchup.hand1.hole, matchup.hand2.hole],
                { cards: [] },
                { mode: "exact" },
                []
            );

            // Store in database
            storeEquity(
                [matchup.hand1.hole, matchup.hand2.hole],
                { cards: [] },
                [],
                result,
                { mode: "exact" }
            );

            computed++;

            // Show progress
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const pct = ((processed / total) * 100).toFixed(1);
            const rate = (processed / parseFloat(elapsed)).toFixed(1);
            const eta = ((total - processed) / parseFloat(rate)).toFixed(0);

            console.log(
                `[${processed}/${total}] ✅ ${matchup.hand1.name} vs ${matchup.hand2.name} | ${pct}% | Elapsed: ${elapsed}s | Rate: ${rate}/s | ETA: ${eta}s | Cached: ${cached} | Computed: ${computed}`
            );
        } catch (error: any) {
            console.error(
                `❌ Error computing ${matchup.hand1.name} vs ${matchup.hand2.name}: ${error.message}`
            );
        }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const finalStats = db
        .prepare("SELECT COUNT(*) as count FROM equity_cache")
        .get() as { count: number };

    console.log("\n" + "=".repeat(60));
    console.log("✨ Seeding complete!");
    console.log("=".repeat(60));
    console.log(`📊 Total matchups processed: ${processed}`);
    console.log(`💾 Cached (skipped): ${cached}`);
    console.log(`🔄 Computed (new): ${computed}`);
    console.log(`⏱️  Total time: ${totalTime}s`);
    console.log(`📈 Average rate: ${(processed / parseFloat(totalTime)).toFixed(1)} matchups/s`);
    console.log(`💾 Total entries in cache: ${finalStats.count}`);
    console.log("=".repeat(60) + "\n");
}

// Run the seeding script
if (require.main === module) {
    seedEquityCache()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Fatal error:", error);
            process.exit(1);
        });
}

export { seedEquityCache };

