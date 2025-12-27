import { calculateTurnOuts } from "../src/integrations/hand/equity";
import { Hole, Board, Card } from "@common/interfaces";

/**
 * Helper to create a card from string like "Ah" (Ace of hearts)
 */
function parseCard(cardStr: string): Card {
    const rankMap: { [key: string]: Card["rank"] } = {
        "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
        "10": 10, "T": 10, "J": 11, "Q": 12, "K": 13, "A": 14
    };
    
    const suitMap: { [key: string]: Card["suit"] } = {
        "c": "c", "d": "d", "h": "h", "s": "s"
    };
    
    // Handle both "Ah" and "14h" formats
    let rankStr: string;
    let suitStr: string;
    
    if (cardStr.length === 2) {
        rankStr = cardStr[0];
        suitStr = cardStr[1];
    } else if (cardStr.length === 3) {
        rankStr = cardStr.slice(0, 2);
        suitStr = cardStr[2];
    } else {
        throw new Error(`Invalid card format: ${cardStr}`);
    }
    
    const rank = rankMap[rankStr] || (parseInt(rankStr) as Card["rank"]);
    const suit = suitMap[suitStr.toLowerCase()];
    
    if (!rank || !suit) {
        throw new Error(`Invalid card: ${cardStr}`);
    }
    
    return { rank, suit };
}

/**
 * Helper to parse multiple cards from a space-separated string
 */
function parseCards(cardsStr: string): Card[] {
    return cardsStr.trim().split(/\s+/).map(parseCard);
}

/**
 * Format a card for display
 */
function formatCard(card: Card | { rank: number; suit: number }): string {
    const rankMap: { [key: number]: string } = {
        2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9",
        10: "T", 11: "J", 12: "Q", 13: "K", 14: "A"
    };
    
    const suitMap: { [key: number]: string } = {
        0: "c", 1: "d", 2: "h", 3: "s"
    };
    
    const rank = rankMap[card.rank] || String(card.rank);
    const suit = typeof (card as any).suit === 'number' 
        ? suitMap[(card as any).suit] 
        : (card as Card).suit;
    
    return `${rank}${suit}`;
}

/**
 * Get category name from category code
 */
function getCategoryName(category: number): string {
    const categoryMap: { [key: number]: string } = {
        0: "high_card",
        1: "pair",
        2: "two_pair",
        3: "three_of_a_kind",
        4: "straight",
        5: "flush",
        6: "full_house",
        7: "four_of_a_kind",
        8: "straight_flush",
        9: "royal_flush",
        10: "flush_draw_completion",
        11: "straight_draw_completion",
        12: "pair_improvement",
        13: "two_pair_improvement",
        14: "set_improvement"
    };
    return categoryMap[category] || `unknown(${category})`;
}

/**
 * Group outs by category
 */
function groupOutsByCategory(outs: any[]): Map<number, any[]> {
    const groups = new Map<number, any[]>();
    for (const out of outs) {
        if (!groups.has(out.category)) {
            groups.set(out.category, []);
        }
        groups.get(out.category)!.push(out);
    }
    return groups;
}

/**
 * Test scenario
 */
async function testScenario(
    name: string,
    heroCards: string,
    villainCards: string,
    boardCards: string
) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`TEST: ${name}`);
    console.log(`${"=".repeat(80)}`);
    console.log(`Hero: ${heroCards}`);
    console.log(`Villain: ${villainCards}`);
    console.log(`Board (Turn): ${boardCards}`);
    console.log();

    const heroCardsArray = parseCards(heroCards);
    const villainCardsArray = parseCards(villainCards);
    
    if (heroCardsArray.length !== 2 || villainCardsArray.length !== 2) {
        throw new Error("Hero and villain must each have exactly 2 cards");
    }
    
    const hero: Hole = { cards: [heroCardsArray[0], heroCardsArray[1]] };
    const villain: Hole = { cards: [villainCardsArray[0], villainCardsArray[1]] };
    const board: Board = { cards: parseCards(boardCards) };

    try {
        const result = await calculateTurnOuts(hero, villain, board);

        console.log(`Baseline Equity:`);
        console.log(`  Win:  ${(result.baseline_win * 100).toFixed(2)}%`);
        console.log(`  Tie:  ${(result.baseline_tie * 100).toFixed(2)}%`);
        console.log(`  Lose: ${(result.baseline_lose * 100).toFixed(2)}%`);
        console.log();

        if (result.suppressed) {
            console.log(`⚠️  OUTS SUPPRESSED`);
            console.log(`Reason: ${result.suppressed.reason}`);
        } else {
            console.log(`Win Outs: ${result.win_outs.length} cards`);
            if (result.win_outs.length > 0) {
                const winGroups = groupOutsByCategory(result.win_outs);
                for (const [category, outs] of winGroups) {
                    const cards = outs.map(o => formatCard({ rank: o.rank, suit: o.suit })).join(", ");
                    console.log(`  ${getCategoryName(category)} (${outs.length}): ${cards}`);
                }
            }
            console.log();

            console.log(`Tie Outs: ${result.tie_outs.length} cards`);
            if (result.tie_outs.length > 0) {
                const tieGroups = groupOutsByCategory(result.tie_outs);
                for (const [category, outs] of tieGroups) {
                    const cards = outs.map(o => formatCard({ rank: o.rank, suit: o.suit })).join(", ");
                    console.log(`  ${getCategoryName(category)} (${outs.length}): ${cards}`);
                }
            }
        }
    } catch (error: any) {
        console.error(`❌ ERROR: ${error.message}`);
    }
}

/**
 * Run all test scenarios
 */
async function runTests() {
    console.log("Texas Hold'em Outs Calculator - Test Suite");
    console.log("=".repeat(80));

    // Test 1: Flush draw (9 outs typically)
    await testScenario(
        "Flush Draw (Hero has Ah Kh, board has Qh Jh 3d 2c)",
        "Ah Kh",
        "9d 9c",
        "Qh Jh 3d 2c"
    );

    // Test 2: Open-ended straight draw (8 outs typically)
    await testScenario(
        "Open-Ended Straight Draw (Hero has Js Ts, board has 9h 8d 3c 2h)",
        "Js Ts",
        "Ah Ad",
        "9h 8d 3c 2h"
    );

    // Test 3: Set draw (2 outs - hitting trips)
    await testScenario(
        "Pocket Pair vs Overpair (Hero has 9h 9s, villain has Ah Ad)",
        "9h 9s",
        "Ah Ad",
        "Kh Qd Jc 3s"
    );

    // Test 4: Suppression case - already ahead
    await testScenario(
        "Already Ahead - Should Suppress (Hero has AA, villain has KK)",
        "Ah Ad",
        "Kh Kd",
        "Qh Jd Tc 2s"
    );

    // Test 5: Suppression case - symmetric situation
    await testScenario(
        "Symmetric Situation - Should Suppress (Both have 5-5)",
        "5h 5d",
        "5s 5c",
        "Ah Kd Qc Jh"
    );

    // Test 6: Combo draw (flush draw + straight draw)
    await testScenario(
        "Combo Draw (Hero has 9h 8h, board has 7h 6h Kd 2c)",
        "9h 8h",
        "Ac Ad",
        "7h 6h Kd 2c"
    );

    // Test 7: Gutshot straight draw (4 outs)
    await testScenario(
        "Gutshot Straight Draw (Hero has Ah Kc, board has Qd Jh 9s 2h)",
        "Ah Kc",
        "8d 8c",
        "Qd Jh 9s 2h"
    );

    console.log(`\n${"=".repeat(80)}`);
    console.log("All tests completed!");
    console.log(`${"=".repeat(80)}\n`);
}

// Run tests
runTests().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});

