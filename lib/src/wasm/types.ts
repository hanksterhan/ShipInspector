// Type definitions for WASM module
export interface WasmModule {
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
