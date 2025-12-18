#!/usr/bin/env node

/**
 * Script to generate test data for Prometheus metrics
 * Pings the equity calculation and hand comparison endpoints multiple times
 * with different variations to generate diverse metrics
 */

const axios = require("axios");

const BASE_URL = process.env.SERVER_URL || "http://localhost:3000";
const DELAY_MS = parseInt(process.env.DELAY_MS || "100", 10); // Delay between requests in milliseconds
const ITERATIONS = parseInt(process.env.ITERATIONS || "1", 10); // Number of times to run all test cases

// Helper function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Equity calculation test cases
const equityTestCases = [
    // Preflop (0 board cards) - 2 players
    {
        players: ["14h 14d", "13h 13d"],
        board: "",
        options: { mode: "mc", iterations: 1000 },
        description: "Preflop - Pocket Aces vs Pocket Kings (MC)",
    },
    {
        players: ["14h 14d", "14c 13c"],
        board: "",
        options: { mode: "exact" },
        description: "Preflop - Pocket Aces vs AKs (Exact)",
    },
    {
        players: ["12h 12d", "11h 11d"],
        board: "",
        options: { mode: "auto" },
        description: "Preflop - Pocket Queens vs Pocket Jacks (Auto)",
    },
    {
        players: ["14h 13h", "12h 11h"],
        board: "",
        options: { mode: "mc", iterations: 2000 },
        description: "Preflop - Ace-King suited vs Queen-Jack suited (MC)",
    },
    // Preflop - 3 players
    {
        players: ["14h 14d", "13h 13d", "12h 12d"],
        board: "",
        options: { mode: "mc", iterations: 1000 },
        description: "Preflop - 3 players (MC)",
    },
    // Preflop - 4 players
    {
        players: ["14h 14d", "13h 13d", "12h 12d", "11h 11d"],
        board: "",
        options: { mode: "mc", iterations: 1000 },
        description: "Preflop - 4 players (MC)",
    },
    // Flop (3 board cards)
    {
        players: ["14h 14d", "13h 13d"],
        board: "12h 11h 10h",
        options: { mode: "exact" },
        description: "Flop - Pocket Aces vs Pocket Kings (Exact)",
    },
    {
        players: ["14h 13h", "12h 11h"],
        board: "10h 9h 8h",
        options: { mode: "auto" },
        description: "Flop - Ace-King vs Queen-Jack (Auto)",
    },
    {
        players: ["14h 14d", "13h 13d", "12h 12d"],
        board: "11h 10h 9h",
        options: { mode: "exact" },
        description: "Flop - 3 players (Exact)",
    },
    // Turn (4 board cards)
    {
        players: ["14h 14d", "13h 13d"],
        board: "12h 11h 10h 9h",
        options: { mode: "exact" },
        description: "Turn - Pocket Aces vs Pocket Kings (Exact)",
    },
    {
        players: ["14h 13h", "12h 11h"],
        board: "10h 9h 8h 7h",
        options: { mode: "auto" },
        description: "Turn - Ace-King vs Queen-Jack (Auto)",
    },
    // River (5 board cards)
    {
        players: ["14h 14d", "13h 13d"],
        board: "12h 11h 10h 9h 8h",
        options: { mode: "auto" },
        description: "River - Pocket Aces vs Pocket Kings (Auto)",
    },
    {
        players: ["14h 13h", "12h 11h"],
        board: "10h 9h 8h 7h 6h",
        options: { mode: "auto" },
        description: "River - Ace-King vs Queen-Jack (Auto)",
    },
    {
        players: ["14h 14d", "13h 13d", "12h 12d"],
        board: "11h 10h 9h 8h 7h",
        options: { mode: "auto" },
        description: "River - 3 players (Auto)",
    },
];

// Hand comparison test cases
const handComparisonTestCases = [
    {
        hole1: "14h 14d",
        hole2: "13h 13d",
        board: "12h 11h 10h 9h 8h",
        description: "Pocket Aces vs Pocket Kings (River)",
    },
    {
        hole1: "14h 13h",
        hole2: "12h 11h",
        board: "10h 9h 8h 7h 6h",
        description: "Ace-King vs Queen-Jack (River)",
    },
    {
        hole1: "9h 9d",
        hole2: "9c 9s",
        board: "8h 8d 8c 7h 7d",
        description: "Four of a kind tie (River)",
    },
    {
        hole1: "14h 13h",
        hole2: "12h 11h",
        board: "10h 9h 8h 7h 6h",
        description: "Straight flush comparison (River)",
    },
    {
        hole1: "14h 14d",
        hole2: "13h 13d",
        board: "12h 12d 11h 11d 10h",
        description: "Full house comparison (River)",
    },
];

/**
 * Make a request to calculate equity
 */
async function calculateEquity(testCase) {
    try {
        const response = await axios.post(
            `${BASE_URL}/poker/equity/calculate`,
            {
                players: testCase.players,
                board: testCase.board,
                options: testCase.options,
            }
        );
        console.log(`✓ ${testCase.description}`);
        return { success: true, response: response.data };
    } catch (error) {
        console.error(
            `✗ ${testCase.description} - Error: ${error.response?.data?.error || error.message}`
        );
        return { success: false, error: error.message };
    }
}

/**
 * Make a request to compare hands
 */
async function compareHands(testCase) {
    try {
        const response = await axios.post(`${BASE_URL}/poker/hand/compare`, {
            hole1: testCase.hole1,
            hole2: testCase.hole2,
            board: testCase.board,
        });
        console.log(
            `✓ ${testCase.description} - Result: ${response.data.comparison.result}`
        );
        return { success: true, response: response.data };
    } catch (error) {
        console.error(
            `✗ ${testCase.description} - Error: ${error.response?.data?.error || error.message}`
        );
        return { success: false, error: error.message };
    }
}

/**
 * Main function to generate metrics data
 */
async function generateMetricsData(iteration = 1, totalIterations = 1) {
    if (totalIterations > 1) {
        console.log(`\n🚀 Generating metrics data for ${BASE_URL} (Iteration ${iteration}/${totalIterations})\n`);
    } else {
        console.log(`\n🚀 Generating metrics data for ${BASE_URL}\n`);
    }
    console.log("=".repeat(60));

    const results = {
        equity: { success: 0, failed: 0 },
        comparison: { success: 0, failed: 0 },
    };

    // Generate equity calculation requests
    console.log("\n📊 Generating Equity Calculation Requests:\n");
    for (const testCase of equityTestCases) {
        const result = await calculateEquity(testCase);
        if (result.success) {
            results.equity.success++;
        } else {
            results.equity.failed++;
        }
        await delay(DELAY_MS);
    }

    // Generate hand comparison requests
    console.log("\n🔄 Generating Hand Comparison Requests:\n");
    for (const testCase of handComparisonTestCases) {
        const result = await compareHands(testCase);
        if (result.success) {
            results.comparison.success++;
        } else {
            results.comparison.failed++;
        }
        await delay(DELAY_MS);
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("\n📈 Summary:\n");
    console.log(`Equity Calculations: ${results.equity.success} successful, ${results.equity.failed} failed`);
    console.log(`Hand Comparisons: ${results.comparison.success} successful, ${results.comparison.failed} failed`);
    console.log(
        `\n✅ Total requests: ${results.equity.success + results.comparison.success} successful`
    );
    console.log(
        `\n💡 Metrics should be available in Prometheus within 10-20 seconds\n`
    );
}

// Run the script
if (require.main === module) {
    (async () => {
        try {
            for (let i = 1; i <= ITERATIONS; i++) {
                await generateMetricsData(i, ITERATIONS);
                if (i < ITERATIONS) {
                    console.log(`\n⏳ Waiting before next iteration...\n`);
                    await delay(DELAY_MS * 10); // Longer delay between iterations
                }
            }
        } catch (error) {
            console.error("Fatal error:", error);
            process.exit(1);
        }
    })();
}

module.exports = { generateMetricsData, calculateEquity, compareHands };

