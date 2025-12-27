import { Card, Hole, Board, EquityResult } from "@common/interfaces";
import * as path from "path";
import * as fs from "fs";

// Type definitions for WASM module
interface WasmModule {
    calculate_preflop_equity(
        player_ranks: Uint8Array,
        player_suits: Uint8Array,
        deck_ranks: Uint8Array,
        deck_suits: Uint8Array,
        num_players: number,
        missing: number
    ): string;
    compute_turn_outs(
        hero_ranks: Uint8Array,
        hero_suits: Uint8Array,
        villain_ranks: Uint8Array,
        villain_suits: Uint8Array,
        board_ranks: Uint8Array,
        board_suits: Uint8Array
    ): string;
}

let wasmModule: WasmModule | null = null;
let wasmModulePromise: Promise<WasmModule> | null = null;

/**
 * Initialize the WASM module (lazy loading)
 */
async function initWasmModule(): Promise<WasmModule> {
    if (wasmModule) {
        return wasmModule;
    }

    if (wasmModulePromise) {
        return wasmModulePromise;
    }

    wasmModulePromise = (async (): Promise<WasmModule> => {
        try {
            // Try to load WASM module from the wasm-equity/pkg directory
            // This will be built using wasm-pack build --target nodejs
            // From dist/server/src/integrations/hand/, go up 3 levels to dist/server/
            // Path: dist/server/src/integrations/hand/ -> ../../../ -> dist/server/
            const wasmPath = path.resolve(
                __dirname,
                "../../../wasm-equity/pkg/wasm_equity.js"
            );

            // wasm-pack with --target nodejs exports the module directly
            // Check if file exists first
            if (!fs.existsSync(wasmPath)) {
                throw new Error(
                    `WASM module not found at ${wasmPath}. Please run 'wasm-pack build --target nodejs' in the wasm-equity directory.`
                );
            }

            // wasm-pack with --target nodejs exports init function
            const wasmInit = require(wasmPath);
            // wasm-pack nodejs target exports init as default or directly
            const wasmInstance = wasmInit.default
                ? await wasmInit.default()
                : wasmInit;
            if (!wasmInstance) {
                throw new Error(
                    "WASM module initialization returned null/undefined"
                );
            }
            wasmModule = wasmInstance;
            return wasmInstance;
        } catch (error: any) {
            throw new Error(
                `Failed to load WASM equity module: ${error.message || error}. Make sure to run 'wasm-pack build --target nodejs' in the wasm-equity directory.`
            );
        }
    })();

    return wasmModulePromise;
}

/**
 * Convert suit string to number: "c"=0, "d"=1, "h"=2, "s"=3
 */
function suitToNumber(suit: string): number {
    switch (suit) {
        case "c":
            return 0;
        case "d":
            return 1;
        case "h":
            return 2;
        case "s":
            return 3;
        default:
            throw new Error(`Invalid suit: ${suit}`);
    }
}

/**
 * Calculate preflop equity using Rust WASM
 * This is optimized for preflop scenarios (board.length === 0)
 */
export async function calculateEquityRust(
    players: readonly Hole[],
    board: Board,
    remainingDeck: Card[]
): Promise<EquityResult> {
    // Only support preflop (empty board) for now
    if (board.cards.length !== 0) {
        throw new Error(
            "Rust equity calculation currently only supports preflop (empty board)"
        );
    }

    const numPlayers = players.length;
    const missing = 5; // Always 5 cards for preflop

    // Prepare player data (ranks and suits separately)
    const playerRanks: number[] = [];
    const playerSuits: number[] = [];

    for (const player of players) {
        for (const card of player.cards) {
            playerRanks.push(card.rank);
            playerSuits.push(suitToNumber(card.suit));
        }
    }

    // Prepare deck data
    const deckRanks: number[] = [];
    const deckSuits: number[] = [];

    for (const card of remainingDeck) {
        deckRanks.push(card.rank);
        deckSuits.push(suitToNumber(card.suit));
    }

    // Initialize WASM module
    const wasm = await initWasmModule();

    // Call WASM function
    const resultJson = wasm.calculate_preflop_equity(
        new Uint8Array(playerRanks),
        new Uint8Array(playerSuits),
        new Uint8Array(deckRanks),
        new Uint8Array(deckSuits),
        numPlayers,
        missing
    );

    // Parse JSON result
    const result = JSON.parse(resultJson) as EquityResult;

    return result;
}

/**
 * Calculate turn outs using Rust WASM
 * Returns outs information for heads-up scenario on the turn
 */
export async function calculateTurnOuts(
    hero: Hole,
    villain: Hole,
    board: Board
): Promise<any> {
    // Validate inputs
    if (hero.cards.length !== 2) {
        throw new Error("Hero must have exactly 2 cards");
    }
    if (villain.cards.length !== 2) {
        throw new Error("Villain must have exactly 2 cards");
    }
    if (board.cards.length !== 4) {
        throw new Error("Board must have exactly 4 cards (turn)");
    }

    // Prepare hero data
    const heroRanks: number[] = hero.cards.map((c) => c.rank);
    const heroSuits: number[] = hero.cards.map((c) => suitToNumber(c.suit));

    // Prepare villain data
    const villainRanks: number[] = villain.cards.map((c) => c.rank);
    const villainSuits: number[] = villain.cards.map((c) =>
        suitToNumber(c.suit)
    );

    // Prepare board data
    const boardRanks: number[] = board.cards.map((c) => c.rank);
    const boardSuits: number[] = board.cards.map((c) => suitToNumber(c.suit));

    // Initialize WASM module
    const wasm = await initWasmModule();

    // Call WASM function
    const resultJson = wasm.compute_turn_outs(
        new Uint8Array(heroRanks),
        new Uint8Array(heroSuits),
        new Uint8Array(villainRanks),
        new Uint8Array(villainSuits),
        new Uint8Array(boardRanks),
        new Uint8Array(boardSuits)
    );

    // Parse JSON result
    const result = JSON.parse(resultJson);

    // Convert OutCard[] to Card[] for easier use
    const numberToSuit = (suit: number): "c" | "d" | "h" | "s" => {
        switch (suit) {
            case 0:
                return "c";
            case 1:
                return "d";
            case 2:
                return "h";
            case 3:
                return "s";
            default:
                throw new Error(`Invalid suit number: ${suit}`);
        }
    };

    result.win_outs_cards = result.win_outs.map((out: any) => ({
        rank: out.rank,
        suit: numberToSuit(out.suit),
    }));

    result.tie_outs_cards = result.tie_outs.map((out: any) => ({
        rank: out.rank,
        suit: numberToSuit(out.suit),
    }));

    return result;
}
