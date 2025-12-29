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
