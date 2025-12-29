/* tslint:disable */
/* eslint-disable */

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
 */
export function calculate_preflop_equity(player_ranks: Uint8Array, player_suits: Uint8Array, deck_ranks: Uint8Array, deck_suits: Uint8Array, num_players: number, _missing: number): string;

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
 */
export function compute_turn_outs(hero_ranks: Uint8Array, hero_suits: Uint8Array, villain_ranks: Uint8Array, villain_suits: Uint8Array, board_ranks: Uint8Array, board_suits: Uint8Array): string;
