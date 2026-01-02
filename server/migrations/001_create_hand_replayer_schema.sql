-- Enable UUID extension (pgcrypto for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums
CREATE TYPE street AS ENUM (
    'PREFLOP',
    'FLOP',
    'TURN',
    'RIVER',
    'SHOWDOWN'
);

CREATE TYPE action_type AS ENUM (
    'POST_SB',
    'POST_BB',
    'POST_ANTE',
    'STRADDLE',
    'FOLD',
    'CHECK',
    'CALL',
    'BET',
    'RAISE',
    'ALL_IN',
    'REVEAL',
    'DEAL_FLOP',
    'DEAL_TURN',
    'DEAL_RIVER',
    'COLLECT',
    'NOTE'
);

-- Table: hands
CREATE TABLE hands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    table_size INT NOT NULL CHECK (table_size >= 2 AND table_size <= 10),
    max_players INT NOT NULL CHECK (max_players >= 2 AND max_players <= 10),
    small_blind BIGINT NOT NULL CHECK (small_blind >= 0),
    big_blind BIGINT NOT NULL CHECK (big_blind >= 0),
    ante BIGINT NOT NULL DEFAULT 0 CHECK (ante >= 0),
    currency TEXT NOT NULL DEFAULT 'chips',
    button_seat INT NOT NULL CHECK (button_seat >= 1 AND button_seat <= 10),
    board_cards TEXT[] DEFAULT '{}',
    meta JSONB DEFAULT '{}'::jsonb
);

-- Indexes for hands
CREATE INDEX idx_hands_user_id_created_at ON hands(user_id, created_at DESC);

-- Table: hand_players
CREATE TABLE hand_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hand_id UUID NOT NULL REFERENCES hands(id) ON DELETE CASCADE,
    seat INT NOT NULL CHECK (seat >= 1 AND seat <= 10),
    player_label TEXT NOT NULL,
    is_hero BOOLEAN NOT NULL DEFAULT false,
    starting_stack BIGINT NOT NULL CHECK (starting_stack >= 0),
    hole_cards TEXT[] DEFAULT '{}',
    meta JSONB DEFAULT '{}'::jsonb,
    UNIQUE(hand_id, seat)
);

-- Indexes for hand_players
CREATE INDEX idx_hand_players_hand_id ON hand_players(hand_id);

-- Table: hand_actions
CREATE TABLE hand_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hand_id UUID NOT NULL REFERENCES hands(id) ON DELETE CASCADE,
    action_index INT NOT NULL,
    street street NOT NULL,
    actor_player_id UUID REFERENCES hand_players(id),
    type action_type NOT NULL,
    amount BIGINT CHECK (amount IS NULL OR amount >= 0),
    raise_to BIGINT CHECK (raise_to IS NULL OR raise_to >= 0),
    target_player_id UUID REFERENCES hand_players(id),
    decision_ms INT CHECK (decision_ms IS NULL OR decision_ms >= 0),
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hand_id, action_index)
);

-- Indexes for hand_actions
CREATE INDEX idx_hand_actions_hand_id_action_index ON hand_actions(hand_id, action_index);
CREATE INDEX idx_hand_actions_hand_id_street ON hand_actions(hand_id, street);
CREATE INDEX idx_hand_actions_actor_player_id ON hand_actions(actor_player_id);

-- Table: action_tags
CREATE TABLE action_tags (
    id SMALLSERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT
);

-- Table: hand_action_tag_map (many-to-many)
CREATE TABLE hand_action_tag_map (
    hand_action_id UUID NOT NULL REFERENCES hand_actions(id) ON DELETE CASCADE,
    tag_id SMALLINT NOT NULL REFERENCES action_tags(id) ON DELETE RESTRICT,
    PRIMARY KEY (hand_action_id, tag_id)
);

-- Index for hand_action_tag_map
CREATE INDEX idx_hand_action_tag_map_tag_id ON hand_action_tag_map(tag_id);

