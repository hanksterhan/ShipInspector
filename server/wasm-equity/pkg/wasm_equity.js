
let imports = {};
imports['__wbindgen_placeholder__'] = module.exports;

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
function decodeText(ptr, len) {
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

/**
 * Calculate preflop equity using exact enumeration
 *
 * Input format (all arrays flattened):
 * - player_ranks: array of ranks for all player cards (2 cards per player)
 * - player_suits: array of suits for all player cards (0=c, 1=d, 2=h, 3=s)
 * - deck_ranks: array of ranks for remaining deck cards
 * - deck_suits: array of suits for remaining deck cards
 * - num_players: number of players
 * - missing: number of cards missing from board (5 for preflop)
 *
 * Returns a JSON string with equity results: {"win":[0.5,0.5],"tie":[0,0],"lose":[0.5,0.5],"samples":1712304}
 * @param {Uint8Array} player_ranks
 * @param {Uint8Array} player_suits
 * @param {Uint8Array} deck_ranks
 * @param {Uint8Array} deck_suits
 * @param {number} num_players
 * @param {number} _missing
 * @returns {string}
 */
function calculate_preflop_equity(player_ranks, player_suits, deck_ranks, deck_suits, num_players, _missing) {
    let deferred5_0;
    let deferred5_1;
    try {
        const ptr0 = passArray8ToWasm0(player_ranks, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(player_suits, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray8ToWasm0(deck_ranks, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArray8ToWasm0(deck_suits, wasm.__wbindgen_malloc);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.calculate_preflop_equity(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, num_players, _missing);
        deferred5_0 = ret[0];
        deferred5_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
    }
}
exports.calculate_preflop_equity = calculate_preflop_equity;

/**
 * Compute turn outs for heads-up Texas Hold'em
 *
 * Input format:
 * - hero_ranks: 2 ranks for hero's hole cards
 * - hero_suits: 2 suits for hero's hole cards
 * - villain_ranks: 2 ranks for villain's hole cards
 * - villain_suits: 2 suits for villain's hole cards
 * - board_ranks: 4 ranks for turn board
 * - board_suits: 4 suits for turn board
 *
 * Returns JSON with outs result or suppression:
 * {
 *   "suppressed": null | { "reason": "string", "baseline_win": 0.45, "baseline_tie": 0.0 },
 *   "win_outs": [{"rank": 14, "suit": 0, "category": 5}],
 *   "tie_outs": [{"rank": 13, "suit": 1, "category": 2}],
 *   "baseline_win": 0.15,
 *   "baseline_tie": 0.05,
 *   "baseline_lose": 0.80,
 *   "total_river_cards": 44
 * }
 * @param {Uint8Array} hero_ranks
 * @param {Uint8Array} hero_suits
 * @param {Uint8Array} villain_ranks
 * @param {Uint8Array} villain_suits
 * @param {Uint8Array} board_ranks
 * @param {Uint8Array} board_suits
 * @returns {string}
 */
function compute_turn_outs(hero_ranks, hero_suits, villain_ranks, villain_suits, board_ranks, board_suits) {
    let deferred7_0;
    let deferred7_1;
    try {
        const ptr0 = passArray8ToWasm0(hero_ranks, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(hero_suits, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray8ToWasm0(villain_ranks, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArray8ToWasm0(villain_suits, wasm.__wbindgen_malloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passArray8ToWasm0(board_ranks, wasm.__wbindgen_malloc);
        const len4 = WASM_VECTOR_LEN;
        const ptr5 = passArray8ToWasm0(board_suits, wasm.__wbindgen_malloc);
        const len5 = WASM_VECTOR_LEN;
        const ret = wasm.compute_turn_outs(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5);
        deferred7_0 = ret[0];
        deferred7_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred7_0, deferred7_1, 1);
    }
}
exports.compute_turn_outs = compute_turn_outs;

exports.__wbindgen_init_externref_table = function() {
    const table = wasm.__wbindgen_externrefs;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
};

const wasmPath = `${__dirname}/wasm_equity_bg.wasm`;
const wasmBytes = require('fs').readFileSync(wasmPath);
const wasmModule = new WebAssembly.Module(wasmBytes);
const wasm = exports.__wasm = new WebAssembly.Instance(wasmModule, imports).exports;

wasm.__wbindgen_start();
