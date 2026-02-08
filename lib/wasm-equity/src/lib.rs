use wasm_bindgen::prelude::*;

// Card representation: rank 2-14 (Ace=14), suit 0-3 (c, d, h, s)
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
struct Card {
    rank: u8,  // 2-14 (Ace=14)
    suit: u8,  // 0-3 (c=0, d=1, h=2, s=3)
}

// Hand rank encoded as u64 for maximum performance:
// - Bits 56-63: category (8 bits)
// - Bits 48-55: tiebreak[0] (8 bits)
// - Bits 40-47: tiebreak[1] (8 bits)
// - Bits 32-39: tiebreak[2] (8 bits)
// - Bits 24-31: tiebreak[3] (8 bits)
// - Bits 16-23: tiebreak[4] (8 bits)
// This allows instant integer comparisons
type HandRank = u64;

#[inline(always)]
fn encode_hand_rank(category: u8, tiebreak: &[u8]) -> HandRank {
    let mut rank = (category as u64) << 56;
    for (i, &val) in tiebreak.iter().take(5).enumerate() {
        rank |= (val as u64) << (48 - (i as u64 * 8));
    }
    rank
}

// Direct 7-card evaluator - avoids 21×5-card evaluation loop
// Uses rank/suit bitmasks and direct computation
#[inline(always)]
fn evaluate_7_card_hand(hole: &[Card; 2], board: &[Card; 5]) -> HandRank {
    let all_cards = [
        hole[0], hole[1],
        board[0], board[1], board[2], board[3], board[4],
    ];
    
    // Build rank and suit bitmasks for fast lookup
    let mut rank_bits = 0u16;
    let mut suit_bits = [0u16; 4]; // One bitset per suit
    let mut rank_counts = [0u8; 15]; // Index 0 unused, 2-14 used
    
    for card in &all_cards {
        rank_bits |= 1u16 << card.rank;
        suit_bits[card.suit as usize] |= 1u16 << card.rank;
        rank_counts[card.rank as usize] += 1;
    }
    
    // Check for flush (5+ cards of same suit)
    let mut flush_suit: Option<u8> = None;
    let mut flush_ranks = 0u16;
    for (suit_idx, &suit_bitset) in suit_bits.iter().enumerate() {
        if suit_bitset.count_ones() >= 5 {
            flush_suit = Some(suit_idx as u8);
            flush_ranks = suit_bitset;
            break;
        }
    }
    
    // Helper function to check for straight in a given rank bitset
    let check_straight = |ranks_bitset: u16| -> Option<u8> {
        let unique_count = ranks_bitset.count_ones();
        if unique_count < 5 {
            return None;
        }
        
        // Extract unique ranks
        let mut unique_ranks = [0u8; 7];
        let mut idx = 0;
        for rank in 2..=14 {
            if (ranks_bitset & (1u16 << rank)) != 0 {
                unique_ranks[idx] = rank;
                idx += 1;
            }
        }
        
        // Check for normal straight (5 consecutive) - find highest
        for start in (0..=(idx as usize).saturating_sub(5)).rev() {
            if unique_ranks[start + 4] - unique_ranks[start] == 4 {
                return Some(unique_ranks[start + 4]);
            }
        }
        
        // Check for wheel (A-2-3-4-5)
        if idx > 0 && unique_ranks[0] == 2 && unique_ranks[idx - 1] == 14 {
            // Check if we have 2,3,4,5
            let mut has_wheel = true;
            for r in 2..=5 {
                if (ranks_bitset & (1u16 << r)) == 0 {
                    has_wheel = false;
                    break;
                }
            }
            if has_wheel {
                return Some(5);
            }
        }
        
        None
    };
    
    // Check for straight flush first (requires flush)
    let straight_flush_high = if flush_suit.is_some() {
        check_straight(flush_ranks)
    } else {
        None
    };
    
    // Check for regular straight (any suits)
    let straight_high = check_straight(rank_bits);
    
    // Get sorted counts (frequency of each rank count)
    let mut counts = [0u8; 7];
    let mut count_idx = 0;
    for &count in rank_counts.iter() {
        if count > 0 {
            counts[count_idx] = count;
            count_idx += 1;
        }
    }
    counts[..count_idx].sort_by(|a, b| b.cmp(a));
    
    // Royal Flush (A-K-Q-J-10, all same suit)
    // Must check if the FLUSH SUIT has the royal straight, not just any suit
    if flush_suit.is_some() {
        // Verify flush suit has 10, J, Q, K, A
        let royal_mask = (1u16 << 10) | (1u16 << 11) | (1u16 << 12) | (1u16 << 13) | (1u16 << 14);
        if (flush_ranks & royal_mask) == royal_mask {
            return encode_hand_rank(9, &[]);
        }
    }
    
    // Straight Flush - use straight_flush_high (computed from flush suit only)
    if straight_flush_high.is_some() {
        return encode_hand_rank(8, &[straight_flush_high.unwrap()]);
    }
    
    // Four of a Kind
    if counts[0] == 4 {
        let four_kind = rank_counts.iter().position(|&c| c == 4).unwrap() as u8;
        // Find the highest kicker (could be a 3, 2, or 1 count)
        let mut kicker = 0u8;
        for rank in (2..=14).rev() {
            if rank != four_kind && rank_counts[rank as usize] > 0 {
                kicker = rank;
                break;
            }
        }
        return encode_hand_rank(7, &[four_kind, kicker]);
    }
    
    // Full House
    if counts[0] == 3 && counts[1] >= 2 {
        let three_kind = rank_counts.iter().rposition(|&c| c == 3).unwrap() as u8;
        // Find the highest pair (could be a second three-of-a-kind, we use it as pair)
        let mut pair = 0u8;
        for rank in (2..=14).rev() {
            if rank != three_kind && rank_counts[rank as usize] >= 2 {
                pair = rank;
                break;
            }
        }
        return encode_hand_rank(6, &[three_kind, pair]);
    }
    
    // Flush
    if flush_suit.is_some() {
        // Extract top 5 ranks from flush suit
        let mut flush_rank_array = [0u8; 7];
        let mut flush_idx = 0;
        for rank in (2..=14).rev() {
            if (flush_ranks & (1u16 << rank)) != 0 {
                flush_rank_array[flush_idx] = rank;
                flush_idx += 1;
                if flush_idx >= 5 {
                    break;
                }
            }
        }
        return encode_hand_rank(5, &flush_rank_array[..5]);
    }
    
    // Straight
    if straight_high.is_some() {
        return encode_hand_rank(4, &[straight_high.unwrap()]);
    }
    
    // Three of a Kind
    if counts[0] == 3 {
        let three_kind = rank_counts.iter().rposition(|&c| c == 3).unwrap() as u8;
        let mut kickers = [0u8; 2];
        let mut kicker_idx = 0;
        // Get top 2 kickers (any count > 0, but not the three_kind)
        for rank in (2..=14).rev() {
            if rank != three_kind && rank_counts[rank as usize] > 0 && kicker_idx < 2 {
                kickers[kicker_idx] = rank;
                kicker_idx += 1;
            }
        }
        return encode_hand_rank(3, &[three_kind, kickers[0], kickers[1]]);
    }
    
    // Two Pair
    if counts[0] == 2 && counts[1] == 2 {
        let mut pairs = [0u8; 2];
        let mut pair_idx = 0;
        for rank in (2..=14).rev() {
            if rank_counts[rank as usize] == 2 && pair_idx < 2 {
                pairs[pair_idx] = rank;
                pair_idx += 1;
            }
        }
        // Find highest kicker (any rank not in the top 2 pairs)
        let mut kicker = 0u8;
        for rank in (2..=14).rev() {
            if rank != pairs[0] && rank != pairs[1] && rank_counts[rank as usize] > 0 {
                kicker = rank;
                break;
            }
        }
        return encode_hand_rank(2, &[pairs[0], pairs[1], kicker]);
    }
    
    // Pair
    if counts[0] == 2 {
        let pair = rank_counts.iter().rposition(|&c| c == 2).unwrap() as u8;
        let mut kickers = [0u8; 3];
        let mut kicker_idx = 0;
        // Get top 3 kickers (any non-pair rank)
        for rank in (2..=14).rev() {
            if rank != pair && rank_counts[rank as usize] > 0 && kicker_idx < 3 {
                kickers[kicker_idx] = rank;
                kicker_idx += 1;
            }
        }
        return encode_hand_rank(1, &[pair, kickers[0], kickers[1], kickers[2]]);
    }
    
    // High Card - get top 5 ranks
    let mut high_ranks = [0u8; 5];
    let mut high_idx = 0;
    for rank in (2..=14).rev() {
        if rank_counts[rank as usize] > 0 && high_idx < 5 {
            high_ranks[high_idx] = rank;
            high_idx += 1;
            if high_idx >= 5 {
                break;
            }
        }
    }
    encode_hand_rank(0, &high_ranks)
}

/// Calculate preflop equity using exact enumeration
/// 
/// Input format (all arrays flattened):
/// - player_ranks: array of ranks for all player cards (2 cards per player)
/// - player_suits: array of suits for all player cards (0=c, 1=d, 2=h, 3=s)
/// - deck_ranks: array of ranks for remaining deck cards
/// - deck_suits: array of suits for remaining deck cards
/// - num_players: number of players
/// - missing: number of cards missing from board (5 for preflop)
/// 
/// Returns a JSON string with equity results: {"win":[0.5,0.5],"tie":[0,0],"lose":[0.5,0.5],"samples":1712304}
#[wasm_bindgen]
pub fn calculate_preflop_equity(
    player_ranks: &[u8],
    player_suits: &[u8],
    deck_ranks: &[u8],
    deck_suits: &[u8],
    num_players: usize,
    _missing: usize,  // Unused: hardcoded to 5 for preflop optimization
) -> String {
    // Parse players (each player has 2 cards) - use fixed-size arrays
    let mut players: Vec<[Card; 2]> = Vec::with_capacity(num_players);
    
    for i in 0..num_players {
        let card1_idx = i * 2;
        let card2_idx = i * 2 + 1;
        
        players.push([
            Card {
                rank: player_ranks[card1_idx],
                suit: player_suits[card1_idx],
            },
            Card {
                rank: player_ranks[card2_idx],
                suit: player_suits[card2_idx],
            },
        ]);
    }
    
    // Parse remaining deck - use Vec since size varies
    let mut remaining_deck: Vec<Card> = Vec::with_capacity(deck_ranks.len());
    for i in 0..deck_ranks.len() {
        remaining_deck.push(Card {
            rank: deck_ranks[i],
            suit: deck_suits[i],
        });
    }
    
    // Calculate equity - use integer counters to avoid f64 math in hot loop
    // Use fixed-point arithmetic with multiplier for ties
    const TIE_MULTIPLIER: u64 = 1_000_000;
    
    // Pre-compute tie fraction lookup table (1/n * TIE_MULTIPLIER for n = 2..9)
    let tie_fractions_lut: [u64; 10] = [
        0,
        0,
        TIE_MULTIPLIER / 2,  // 1/2
        TIE_MULTIPLIER / 3,  // 1/3
        TIE_MULTIPLIER / 4,  // 1/4
        TIE_MULTIPLIER / 5,  // 1/5
        TIE_MULTIPLIER / 6,  // 1/6
        TIE_MULTIPLIER / 7,  // 1/7
        TIE_MULTIPLIER / 8,  // 1/8
        TIE_MULTIPLIER / 9,  // 1/9
    ];
    
    let mut wins = vec![0u64; num_players];
    let mut ties = vec![0u64; num_players];  // Stored as fixed-point (multiply by TIE_MULTIPLIER)
    let mut total_combos = 0u64;
    
    // Pre-allocate all arrays outside the hot loop to avoid per-combo allocations
    let mut complete_board = [Card { rank: 0, suit: 0 }; 5];
    let mut player_ranks_eval = vec![0u64; num_players];
    // Use fixed-size array for winners (max 9 players typically, but use Vec with capacity)
    let mut winners = vec![0usize; num_players];
    
    // Specialized preflop enumeration: 5 nested loops for k=5 (missing=5)
    // This eliminates recursive closure overhead and deck_indices allocation
    let deck_len = remaining_deck.len();
    
    // 5 nested loops to enumerate all C(deck_len, 5) combinations
    for i0 in 0..deck_len {
        for i1 in (i0 + 1)..deck_len {
            for i2 in (i1 + 1)..deck_len {
                for i3 in (i2 + 1)..deck_len {
                    for i4 in (i3 + 1)..deck_len {
                        // Build complete board directly
                        complete_board[0] = remaining_deck[i0];
                        complete_board[1] = remaining_deck[i1];
                        complete_board[2] = remaining_deck[i2];
                        complete_board[3] = remaining_deck[i3];
                        complete_board[4] = remaining_deck[i4];
                        
                        // Evaluate board for all players - reuse pre-allocated array
                        for (player_idx, player_hole) in players.iter().enumerate() {
                            player_ranks_eval[player_idx] = evaluate_7_card_hand(player_hole, &complete_board);
                        }
                        
                        // Find winners using integer comparisons - reuse pre-allocated array
                        let mut best_hand = player_ranks_eval[0];
                        let mut winner_count = 1;
                        winners[0] = 0;
                        
                        for i in 1..num_players {
                            if player_ranks_eval[i] > best_hand {
                                best_hand = player_ranks_eval[i];
                                winner_count = 1;
                                winners[0] = i;
                            } else if player_ranks_eval[i] == best_hand {
                                winners[winner_count] = i;
                                winner_count += 1;
                            }
                        }
                        
                        // Update wins/ties using integer arithmetic (no f64 math in hot loop)
                        if winner_count > 1 {
                            // For ties, add fixed-point share (1/winner_count * TIE_MULTIPLIER) to each winner
                            // Use lookup table for fast integer division
                            let tie_share = tie_fractions_lut[winner_count.min(9) as usize];
                            for i in 0..winner_count {
                                ties[winners[i]] += tie_share;
                            }
                        } else {
                            wins[winners[0]] += 1;
                        }
                        
                        total_combos += 1;
                    }
                }
            }
        }
    }
    
    // Convert integer counters to fractions (compute fractions once at the end)
    let total_combos_f = total_combos as f64;
    let tie_multiplier_f = TIE_MULTIPLIER as f64;
    
    // Convert wins (already integers) and ties (fixed-point) to fractions
    let win_fractions: Vec<f64> = wins.iter().map(|&w| w as f64 / total_combos_f).collect();
    let tie_fractions: Vec<f64> = ties.iter().map(|&t| t as f64 / tie_multiplier_f / total_combos_f).collect();
    let lose_fractions: Vec<f64> = win_fractions
        .iter()
        .zip(tie_fractions.iter())
        .map(|(&w, &t)| 1.0 - w - t)
        .collect();
    
    // Build JSON result
    format!(
        r#"{{"win":{:?},"tie":{:?},"lose":{:?},"samples":{}}}"#,
        win_fractions, tie_fractions, lose_fractions, total_combos
    )
}

/// Analyze what kind of improvement an out provides
/// Returns a more detailed category code:
/// 0-9: hand rank categories (as before)
/// 10: flush draw completion
/// 11: straight draw completion  
/// 12: pair improvement
/// 13: two pair improvement
/// 14: set/trips improvement
/// For v1, we use simplified heuristics based on suit/rank patterns
#[inline(always)]
fn categorize_out_detailed(
    hero_hole: &[Card; 2],
    board_4: &[Card; 4],
    river_card: Card,
    hero_rank_after: HandRank,
) -> u8 {
    let category_after = (hero_rank_after >> 56) as u8;
    
    // For high-value hands, just return the category
    if category_after >= 6 {
        return category_after; // Full house or better
    }
    
    // Check for flush completion (5=flush category)
    if category_after == 5 {
        // Count suits in board + river
        let mut suit_counts = [0u8; 4];
        for card in board_4 {
            suit_counts[card.suit as usize] += 1;
        }
        suit_counts[river_card.suit as usize] += 1;
        
        // If we have 3+ of river suit on board+river, this completed a flush draw
        if suit_counts[river_card.suit as usize] >= 3 {
            return 10; // Flush draw completion
        }
        return 5; // Flush (but not a draw completion)
    }
    
    // Check for straight completion (4=straight category)
    if category_after == 4 {
        return 11; // Straight draw completion (simplified)
    }
    
    // Check for set/trips (3=three_of_a_kind category)
    if category_after == 3 {
        // Check if river pairs one of our hole cards
        if river_card.rank == hero_hole[0].rank || river_card.rank == hero_hole[1].rank {
            return 14; // Set improvement
        }
        return 3; // Three of a kind (trips on board)
    }
    
    // Check for two pair (2=two_pair category)
    if category_after == 2 {
        return 13; // Two pair improvement
    }
    
    // Check for pair (1=pair category)
    if category_after == 1 {
        return 12; // Pair improvement
    }
    
    // Default: return category as-is
    category_after
}

/// Compute turn outs for heads-up Texas Hold'em
/// 
/// Input format:
/// - hero_ranks: 2 ranks for hero's hole cards
/// - hero_suits: 2 suits for hero's hole cards
/// - villain_ranks: 2 ranks for villain's hole cards
/// - villain_suits: 2 suits for villain's hole cards
/// - board_ranks: 4 ranks for turn board
/// - board_suits: 4 suits for turn board
/// 
/// Returns JSON with outs result or suppression:
/// {
///   "suppressed": null | { "reason": "string", "baseline_win": 0.45, "baseline_tie": 0.0 },
///   "win_outs": [{"rank": 14, "suit": 0, "category": 5}],
///   "tie_outs": [{"rank": 13, "suit": 1, "category": 2}],
///   "baseline_win": 0.15,
///   "baseline_tie": 0.05,
///   "baseline_lose": 0.80,
///   "total_river_cards": 44
/// }
#[wasm_bindgen]
pub fn compute_turn_outs(
    hero_ranks: &[u8],
    hero_suits: &[u8],
    villain_ranks: &[u8],
    villain_suits: &[u8],
    board_ranks: &[u8],
    board_suits: &[u8],
) -> String {
    // Validate inputs
    if hero_ranks.len() != 2 || hero_suits.len() != 2 {
        return r#"{"error":"Hero must have exactly 2 cards"}"#.to_string();
    }
    if villain_ranks.len() != 2 || villain_suits.len() != 2 {
        return r#"{"error":"Villain must have exactly 2 cards"}"#.to_string();
    }
    if board_ranks.len() != 4 || board_suits.len() != 4 {
        return r#"{"error":"Board must have exactly 4 cards (turn)"}"#.to_string();
    }
    
    // Parse hero and villain hole cards
    let hero_hole = [
        Card { rank: hero_ranks[0], suit: hero_suits[0] },
        Card { rank: hero_ranks[1], suit: hero_suits[1] },
    ];
    
    let villain_hole = [
        Card { rank: villain_ranks[0], suit: villain_suits[0] },
        Card { rank: villain_ranks[1], suit: villain_suits[1] },
    ];
    
    // Parse board (4 cards)
    let board_4 = [
        Card { rank: board_ranks[0], suit: board_suits[0] },
        Card { rank: board_ranks[1], suit: board_suits[1] },
        Card { rank: board_ranks[2], suit: board_suits[2] },
        Card { rank: board_ranks[3], suit: board_suits[3] },
    ];
    
    // Build remaining deck - all 52 cards minus known 8
    let mut remaining_deck: Vec<Card> = Vec::with_capacity(44);
    let mut is_known = [[false; 4]; 15]; // rank x suit matrix for fast lookup
    
    // Mark known cards
    for card in &[hero_hole[0], hero_hole[1], villain_hole[0], villain_hole[1], 
                  board_4[0], board_4[1], board_4[2], board_4[3]] {
        is_known[card.rank as usize][card.suit as usize] = true;
    }
    
    // Build remaining deck
    for rank in 2..=14 {
        for suit in 0..4 {
            if !is_known[rank as usize][suit as usize] {
                remaining_deck.push(Card { rank, suit });
            }
        }
    }
    
    // Evaluate all possible river cards and compute baseline equity
    let mut wins = 0u32;
    let mut ties = 0u32;
    let mut loses = 0u32;
    
    // Storage for win/tie outs
    let mut win_outs: Vec<(Card, u8)> = Vec::with_capacity(44); // (card, category)
    let mut tie_outs: Vec<(Card, u8)> = Vec::with_capacity(44);
    
    // Pre-allocate board array
    let mut complete_board = [Card { rank: 0, suit: 0 }; 5];
    complete_board[0] = board_4[0];
    complete_board[1] = board_4[1];
    complete_board[2] = board_4[2];
    complete_board[3] = board_4[3];
    
    // Evaluate all possible river cards
    for river_card in &remaining_deck {
        complete_board[4] = *river_card;
        
        let hero_rank = evaluate_7_card_hand(&hero_hole, &complete_board);
        let villain_rank = evaluate_7_card_hand(&villain_hole, &complete_board);
        
        if hero_rank > villain_rank {
            wins += 1;
            // Use detailed categorization to understand what type of out this is
            let category = categorize_out_detailed(&hero_hole, &board_4, *river_card, hero_rank);
            win_outs.push((*river_card, category));
        } else if hero_rank == villain_rank {
            ties += 1;
            let category = categorize_out_detailed(&hero_hole, &board_4, *river_card, hero_rank);
            tie_outs.push((*river_card, category));
        } else {
            loses += 1;
        }
    }
    
    let total = remaining_deck.len() as f64;
    let p_win = wins as f64 / total;
    let p_tie = ties as f64 / total;
    let p_lose = loses as f64 / total;
    
    // Check suppression criteria: P(tie) >= 0.50 OR P(win) >= 0.45
    if p_tie >= 0.50 || p_win >= 0.45 {
        let reason = if p_tie >= 0.50 {
            format!("High tie probability ({:.1}%): showing outs would be misleading in symmetric situations", p_tie * 100.0)
        } else {
            format!("Already winning/ahead ({:.1}% win): outs are less meaningful", p_win * 100.0)
        };
        
        return format!(
            r#"{{"suppressed":{{"reason":"{}","baseline_win":{:.4},"baseline_tie":{:.4}}},"win_outs":[],"tie_outs":[],"baseline_win":{:.4},"baseline_tie":{:.4},"baseline_lose":{:.4},"total_river_cards":{}}}"#,
            reason, p_win, p_tie, p_win, p_tie, p_lose, remaining_deck.len()
        );
    }
    
    // Build JSON arrays for win_outs and tie_outs
    let win_outs_json: Vec<String> = win_outs
        .iter()
        .map(|(card, category)| {
            format!(
                r#"{{"rank":{},"suit":{},"category":{}}}"#,
                card.rank, card.suit, category
            )
        })
        .collect();
    
    let tie_outs_json: Vec<String> = tie_outs
        .iter()
        .map(|(card, category)| {
            format!(
                r#"{{"rank":{},"suit":{},"category":{}}}"#,
                card.rank, card.suit, category
            )
        })
        .collect();
    
    format!(
        r#"{{"suppressed":null,"win_outs":[{}],"tie_outs":[{}],"baseline_win":{:.4},"baseline_tie":{:.4},"baseline_lose":{:.4},"total_river_cards":{}}}"#,
        win_outs_json.join(","),
        tie_outs_json.join(","),
        p_win,
        p_tie,
        p_lose,
        remaining_deck.len()
    )
}
