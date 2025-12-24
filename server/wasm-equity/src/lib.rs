use wasm_bindgen::prelude::*;

// Card representation: rank 2-14 (Ace=14), suit 0-3 (c, d, h, s)
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
struct Card {
    rank: u8,  // 2-14 (Ace=14)
    suit: u8,  // 0-3 (c=0, d=1, h=2, s=3)
}

#[derive(Debug, Clone)]
struct HandRank {
    category: u8,      // 0=high card, 9=royal flush
    tiebreak: Vec<u8>, // Tiebreaking ranks
}

// Hand evaluation functions
impl HandRank {
    fn compare(&self, other: &HandRank) -> i32 {
        if self.category > other.category {
            return 1;
        }
        if self.category < other.category {
            return -1;
        }
        // Categories are equal, compare tiebreakers
        for i in 0..self.tiebreak.len().max(other.tiebreak.len()) {
            let a_rank = self.tiebreak.get(i).copied().unwrap_or(0);
            let b_rank = other.tiebreak.get(i).copied().unwrap_or(0);
            if a_rank > b_rank {
                return 1;
            }
            if a_rank < b_rank {
                return -1;
            }
        }
        0
    }
}

fn evaluate_5_card_hand(cards: &[Card]) -> HandRank {
    let mut ranks: Vec<u8> = cards.iter().map(|c| c.rank).collect();
    ranks.sort_by(|a, b| b.cmp(a)); // Sort descending
    
    let suits: Vec<u8> = cards.iter().map(|c| c.suit).collect();
    
    // Count occurrences of each rank
    let mut rank_counts = [0u8; 15]; // Index 0 unused, 2-14 used
    for rank in &ranks {
        rank_counts[*rank as usize] += 1;
    }
    
    let mut counts: Vec<u8> = rank_counts.iter().filter(|&&c| c > 0).copied().collect();
    counts.sort_by(|a, b| b.cmp(a));
    
    let is_flush = suits.iter().all(|&s| s == suits[0]);
    let is_straight = is_straight_ranks(&ranks);
    
    // Royal Flush (A-K-Q-J-10, all same suit)
    if is_flush && is_straight && ranks[0] == 14 && ranks[4] == 10 {
        return HandRank {
            category: 9,
            tiebreak: vec![],
        };
    }
    
    // Straight Flush
    if is_flush && is_straight {
        return HandRank {
            category: 8,
            tiebreak: vec![get_straight_high(&ranks)],
        };
    }
    
    // Four of a Kind
    if counts[0] == 4 {
        let four_kind = rank_counts.iter().position(|&c| c == 4).unwrap() as u8;
        let kicker = rank_counts.iter().position(|&c| c == 1).unwrap() as u8;
        return HandRank {
            category: 7,
            tiebreak: vec![four_kind, kicker],
        };
    }
    
    // Full House
    if counts[0] == 3 && counts[1] == 2 {
        let three_kind = rank_counts.iter().position(|&c| c == 3).unwrap() as u8;
        let pair = rank_counts.iter().position(|&c| c == 2).unwrap() as u8;
        return HandRank {
            category: 6,
            tiebreak: vec![three_kind, pair],
        };
    }
    
    // Flush
    if is_flush {
        return HandRank {
            category: 5,
            tiebreak: ranks.clone(),
        };
    }
    
    // Straight
    if is_straight {
        return HandRank {
            category: 4,
            tiebreak: vec![get_straight_high(&ranks)],
        };
    }
    
    // Three of a Kind
    if counts[0] == 3 {
        let three_kind = rank_counts.iter().position(|&c| c == 3).unwrap() as u8;
        let mut kickers: Vec<u8> = rank_counts
            .iter()
            .enumerate()
            .filter(|(_, &c)| c == 1)
            .map(|(i, _)| i as u8)
            .collect();
        kickers.sort_by(|a, b| b.cmp(a));
        kickers.insert(0, three_kind);
        return HandRank {
            category: 3,
            tiebreak: kickers,
        };
    }
    
    // Two Pair
    if counts[0] == 2 && counts[1] == 2 {
        let pairs: Vec<u8> = rank_counts
            .iter()
            .enumerate()
            .filter(|(_, &c)| c == 2)
            .map(|(i, _)| i as u8)
            .collect();
        let mut sorted_pairs = pairs.clone();
        sorted_pairs.sort_by(|a, b| b.cmp(a));
        let kicker = rank_counts.iter().position(|&c| c == 1).unwrap() as u8;
        sorted_pairs.push(kicker);
        return HandRank {
            category: 2,
            tiebreak: sorted_pairs,
        };
    }
    
    // Pair
    if counts[0] == 2 {
        let pair = rank_counts.iter().position(|&c| c == 2).unwrap() as u8;
        let mut kickers: Vec<u8> = rank_counts
            .iter()
            .enumerate()
            .filter(|(_, &c)| c == 1)
            .map(|(i, _)| i as u8)
            .collect();
        kickers.sort_by(|a, b| b.cmp(a));
        kickers.insert(0, pair);
        return HandRank {
            category: 1,
            tiebreak: kickers,
        };
    }
    
    // High Card
    HandRank {
        category: 0,
        tiebreak: ranks,
    }
}

fn is_straight_ranks(ranks: &[u8]) -> bool {
    let mut unique_ranks: Vec<u8> = ranks.iter().copied().collect();
    unique_ranks.sort();
    unique_ranks.dedup();
    
    if unique_ranks.len() != 5 {
        return false;
    }
    
    // Check for normal straight
    if unique_ranks[4] - unique_ranks[0] == 4 {
        return true;
    }
    
    // Check for A-2-3-4-5 low straight (wheel)
    if unique_ranks[0] == 2
        && unique_ranks[1] == 3
        && unique_ranks[2] == 4
        && unique_ranks[3] == 5
        && unique_ranks[4] == 14
    {
        return true;
    }
    
    false
}

fn get_straight_high(ranks: &[u8]) -> u8 {
    let mut unique_ranks: Vec<u8> = ranks.iter().copied().collect();
    unique_ranks.sort();
    unique_ranks.dedup();
    
    // Check for wheel (A-2-3-4-5)
    if unique_ranks[0] == 2 && unique_ranks[4] == 14 {
        return 5;
    }
    
    unique_ranks[4]
}

fn evaluate_7_card_hand(hole: &[Card], board: &[Card]) -> HandRank {
    // Combine hole and board
    let mut all_cards = Vec::with_capacity(7);
    all_cards.extend_from_slice(hole);
    all_cards.extend_from_slice(board);
    
    // Try all C(7,5) = 21 combinations
    let mut best_hand: Option<HandRank> = None;
    
    for i in 0..7 {
        for j in (i + 1)..7 {
            // Build 5-card combination by excluding indices i and j
            let mut five_cards = Vec::with_capacity(5);
            for k in 0..7 {
                if k != i && k != j {
                    five_cards.push(all_cards[k]);
                }
            }
            
            let hand_rank = evaluate_5_card_hand(&five_cards);
            
            if let Some(ref best) = best_hand {
                if hand_rank.compare(best) > 0 {
                    best_hand = Some(hand_rank);
                }
            } else {
                best_hand = Some(hand_rank);
            }
        }
    }
    
    best_hand.unwrap()
}

// Generate all combinations of k items from array (iterative approach)
fn iterate_combinations<F>(array: &[u8], k: usize, mut callback: F)
where
    F: FnMut(&[u8]),
{
    if k == 0 {
        callback(&[]);
        return;
    }
    if k == array.len() {
        callback(array);
        return;
    }
    if k > array.len() {
        return;
    }
    
    let mut combo = Vec::with_capacity(k);
    iterate_combinations_helper(array, k, 0, &mut combo, &mut callback);
}

fn iterate_combinations_helper<F>(
    array: &[u8],
    k: usize,
    start: usize,
    combo: &mut Vec<u8>,
    callback: &mut F,
) where
    F: FnMut(&[u8]),
{
    if combo.len() == k {
        callback(combo);
        return;
    }
    
    let remaining = k - combo.len();
    let max_start = array.len() - remaining;
    
    for i in start..=max_start {
        combo.push(array[i]);
        iterate_combinations_helper(array, k, i + 1, combo, callback);
        combo.pop();
    }
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
    missing: usize,
) -> String {
    // Parse players (each player has 2 cards)
    let mut players: Vec<Vec<Card>> = Vec::with_capacity(num_players);
    
    for i in 0..num_players {
        let card1_idx = i * 2;
        let card2_idx = i * 2 + 1;
        
        let card1 = Card {
            rank: player_ranks[card1_idx],
            suit: player_suits[card1_idx],
        };
        let card2 = Card {
            rank: player_ranks[card2_idx],
            suit: player_suits[card2_idx],
        };
        
        players.push(vec![card1, card2]);
    }
    
    // Parse remaining deck
    let mut remaining_deck: Vec<Card> = Vec::with_capacity(deck_ranks.len());
    for i in 0..deck_ranks.len() {
        remaining_deck.push(Card {
            rank: deck_ranks[i],
            suit: deck_suits[i],
        });
    }
    
    // For preflop, board is empty (0 cards)
    let board: Vec<Card> = vec![];
    
    // Calculate equity
    let mut wins = vec![0.0; num_players];
    let mut ties = vec![0.0; num_players];
    let mut total_combos = 0u64;
    
    // Enumerate all board combinations
    // Convert deck to indices for combination generation
    let deck_indices: Vec<u8> = (0..remaining_deck.len() as u8).collect();
    
    iterate_combinations(&deck_indices, missing, |combo_indices| {
        // Build complete board
        let mut complete_board = Vec::with_capacity(5);
        for &idx in combo_indices {
            complete_board.push(remaining_deck[idx as usize]);
        }
        
        // Evaluate board for all players
        let mut player_ranks_eval: Vec<HandRank> = Vec::with_capacity(num_players);
        for player_hole in &players {
            let hand_rank = evaluate_7_card_hand(player_hole, &complete_board);
            player_ranks_eval.push(hand_rank);
        }
        
        // Find winners
        let mut best_hand = &player_ranks_eval[0];
        let mut winners = vec![0];
        
        for i in 1..num_players {
            let comparison = player_ranks_eval[i].compare(best_hand);
            if comparison > 0 {
                best_hand = &player_ranks_eval[i];
                winners.clear();
                winners.push(i);
            } else if comparison == 0 {
                winners.push(i);
            }
        }
        
        // Update wins/ties
        if winners.len() > 1 {
            let tie_value = 1.0 / winners.len() as f64;
            for &winner_idx in &winners {
                ties[winner_idx] += tie_value;
            }
        } else {
            wins[winners[0]] += 1.0;
        }
        
        total_combos += 1;
    });
    
    // Convert to fractions
    let total_combos_f = total_combos as f64;
    let win_fractions: Vec<f64> = wins.iter().map(|&w| w / total_combos_f).collect();
    let tie_fractions: Vec<f64> = ties.iter().map(|&t| t / total_combos_f).collect();
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

