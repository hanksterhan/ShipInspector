import { Request, Response } from "express";
import { Hole, Board } from "@common/interfaces";
import { computeEquity } from "../integrations/hand/equity";
import db from "../config/database";
import { createEquityKey } from "../integrations/hand/equityLookup";
import { ApiErrorResponse } from "@common/interfaces";

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
    const handMap = new Map(allHands.map((h) => [h.name, h]));

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
async function seedEquityCache(handCount: number = 50): Promise<{
    processed: number;
    cached: number;
    computed: number;
    totalTime: number;
    totalEntries: number;
}> {
    console.log("🎲 Starting equity cache seeding...\n");

    // Get top hands (adjust count as needed)
    const topHands = getTopHands(handCount);
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

        // Use "auto" mode for pre-flop - it will choose the best method
        // For pre-flop, exact enumeration is too slow (C(48,5) = 1.7M combinations)
        // Auto mode will use Monte Carlo for pre-flop, exact for smaller boards
        const options = { mode: "auto" as const, iterations: 10000 };

        // Check if already cached
        const key = createEquityKey(
            [matchup.hand1.hole, matchup.hand2.hole],
            { cards: [] },
            [],
            options
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
            const result = await computeEquity(
                [matchup.hand1.hole, matchup.hand2.hole],
                { cards: [] },
                options,
                []
            );

            // Store in database
            storeEquity(
                [matchup.hand1.hole, matchup.hand2.hole],
                { cards: [] },
                [],
                result,
                options
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

    const totalTime = (Date.now() - startTime) / 1000;
    const finalStats = db
        .prepare("SELECT COUNT(*) as count FROM equity_cache")
        .get() as { count: number };

    console.log("\n" + "=".repeat(60));
    console.log("✨ Seeding complete!");
    console.log("=".repeat(60));
    console.log(`📊 Total matchups processed: ${processed}`);
    console.log(`💾 Cached (skipped): ${cached}`);
    console.log(`🔄 Computed (new): ${computed}`);
    console.log(`⏱️  Total time: ${totalTime.toFixed(1)}s`);
    console.log(
        `📈 Average rate: ${(processed / totalTime).toFixed(1)} matchups/s`
    );
    console.log(`💾 Total entries in cache: ${finalStats.count}`);
    console.log("=".repeat(60) + "\n");

    return {
        processed,
        cached,
        computed,
        totalTime,
        totalEntries: finalStats.count,
    };
}

class DatabaseHandler {
    /**
     * Seed the equity cache database
     * POST /db/equity-cache/seed
     *
     * Optional query params:
     * - handCount: number of top hands to seed (default: 50)
     */
    seedEquityCache = async (req: Request, res: Response) => {
        try {
            const handCount = parseInt(req.query.handCount as string) || 50;

            if (handCount < 1 || handCount > 169) {
                const errorResponse: ApiErrorResponse = {
                    error: "handCount must be between 1 and 169",
                };
                return res.status(400).json(errorResponse);
            }

            // Start seeding in background (don't await to return immediately)
            seedEquityCache(handCount)
                .then((result) => {
                    console.log("✅ Seeding completed successfully");
                    console.log(`   Processed: ${result.processed} matchups`);
                    console.log(`   Cached: ${result.cached} (skipped)`);
                    console.log(`   Computed: ${result.computed} (new)`);
                    console.log(
                        `   Total time: ${result.totalTime.toFixed(1)}s`
                    );
                    console.log(`   Total entries: ${result.totalEntries}`);
                })
                .catch((error) => {
                    console.error("❌ Seeding failed with error:", error);
                    if (error instanceof Error) {
                        console.error("   Error message:", error.message);
                        console.error("   Stack trace:", error.stack);
                    }
                });

            // Return immediately with status
            res.status(202).json({
                message: "Equity cache seeding started",
                handCount,
                estimatedMatchups: (handCount * (handCount - 1)) / 2,
                status: "processing",
                note: "Check server logs for progress updates",
            });
        } catch (error: any) {
            const errorResponse: ApiErrorResponse = {
                error: error.message || "Failed to start seeding",
            };
            return res.status(500).json(errorResponse);
        }
    };

    /**
     * Get equity cache statistics
     * GET /db/equity-cache/stats
     */
    getEquityCacheStats = async (req: Request, res: Response) => {
        try {
            const sizeStmt = db.prepare(
                "SELECT COUNT(*) as count FROM equity_cache"
            );
            const size = (sizeStmt.get() as { count: number }).count;

            const totalAccessStmt = db.prepare(
                "SELECT SUM(access_count) as total FROM equity_cache"
            );
            const totalAccesses =
                (totalAccessStmt.get() as { total: number | null }).total || 0;

            const topAccessedStmt = db.prepare(`
                SELECT key, access_count 
                FROM equity_cache 
                ORDER BY access_count DESC 
                LIMIT 10
            `);
            const mostAccessed = topAccessedStmt.all() as Array<{
                key: string;
                access_count: number;
            }>;

            res.status(200).json({
                size,
                totalAccesses,
                mostAccessed: mostAccessed.map((item) => ({
                    key: item.key,
                    count: item.access_count,
                })),
            });
        } catch (error: any) {
            const errorResponse: ApiErrorResponse = {
                error: error.message || "Failed to get cache statistics",
            };
            return res.status(500).json(errorResponse);
        }
    };
}

export const databaseHandler = new DatabaseHandler();
