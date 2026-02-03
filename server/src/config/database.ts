import { neon } from "@neondatabase/serverless";

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error(
        "DATABASE_URL environment variable is required for Neon database connection"
    );
}

// Create Neon SQL client
const sql = neon(databaseUrl);

// Initialize database schema
async function initializeDatabase() {
    try {
        // Create invite_codes table
        await sql`
            CREATE TABLE IF NOT EXISTS invite_codes (
                code TEXT PRIMARY KEY,
                used INTEGER DEFAULT 0,
                used_by_email TEXT,
                used_at BIGINT,
                created_at BIGINT NOT NULL,
                created_by TEXT
            )
        `;

        // Create indexes for invite codes
        await sql`
            CREATE INDEX IF NOT EXISTS idx_invite_codes_used 
            ON invite_codes(used)
        `;

        await sql`
            CREATE INDEX IF NOT EXISTS idx_invite_codes_created_at 
            ON invite_codes(created_at)
        `;

        // Create users table
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                created_at BIGINT NOT NULL,
                updated_at BIGINT
            )
        `;

        // Create indexes for users
        await sql`
            CREATE INDEX IF NOT EXISTS idx_users_email 
            ON users(email)
        `;

        await sql`
            CREATE INDEX IF NOT EXISTS idx_users_role
            ON users(role)
        `;

        // Create hands table
        await sql`
            CREATE TABLE IF NOT EXISTS hands (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                table_size SMALLINT NOT NULL CHECK (table_size >= 2 AND table_size <= 10),
                button_seat SMALLINT NOT NULL CHECK (button_seat >= 0),
                small_blind INTEGER NOT NULL CHECK (small_blind > 0),
                big_blind INTEGER NOT NULL CHECK (big_blind > 0),
                ante INTEGER NOT NULL DEFAULT 0 CHECK (ante >= 0),
                board_flop_1 TEXT,
                board_flop_2 TEXT,
                board_flop_3 TEXT,
                board_turn TEXT,
                board_river TEXT,
                created_at BIGINT NOT NULL,
                updated_at BIGINT,
                deleted_at BIGINT,
                CONSTRAINT chk_button_seat CHECK (button_seat < table_size)
            )
        `;

        // Create indexes for hands
        await sql`
            CREATE INDEX IF NOT EXISTS idx_hands_owner_created
                ON hands(owner_user_id, created_at DESC)
                WHERE deleted_at IS NULL
        `;

        await sql`
            CREATE INDEX IF NOT EXISTS idx_hands_deleted_at
                ON hands(deleted_at)
                WHERE deleted_at IS NOT NULL
        `;

        // Create hand_players table
        await sql`
            CREATE TABLE IF NOT EXISTS hand_players (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                hand_id UUID NOT NULL REFERENCES hands(id) ON DELETE CASCADE,
                seat_index SMALLINT NOT NULL CHECK (seat_index >= 0 AND seat_index < 10),
                display_name TEXT NOT NULL DEFAULT '',
                stack_at_start INTEGER NOT NULL CHECK (stack_at_start > 0),
                is_hero BOOLEAN NOT NULL DEFAULT FALSE,
                showdown_card_1 TEXT,
                showdown_card_2 TEXT,
                created_at BIGINT NOT NULL,
                updated_at BIGINT,
                deleted_at BIGINT,
                UNIQUE(hand_id, seat_index)
            )
        `;

        // Create indexes for hand_players
        await sql`
            CREATE INDEX IF NOT EXISTS idx_hand_players_hand_id
                ON hand_players(hand_id)
                WHERE deleted_at IS NULL
        `;

        await sql`
            CREATE INDEX IF NOT EXISTS idx_hand_players_hero
                ON hand_players(hand_id)
                WHERE is_hero = TRUE AND deleted_at IS NULL
        `;

        // Create hand_actions table
        await sql`
            CREATE TABLE IF NOT EXISTS hand_actions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                hand_id UUID NOT NULL REFERENCES hands(id) ON DELETE CASCADE,
                sequence_index SMALLINT NOT NULL CHECK (sequence_index >= 0),
                street TEXT NOT NULL CHECK (street IN ('preflop', 'flop', 'turn', 'river')),
                actor_seat SMALLINT CHECK (actor_seat >= 0 AND actor_seat < 10),
                action_type TEXT NOT NULL,
                amount INTEGER,
                raise_to INTEGER,
                decision_ms INTEGER,
                tags TEXT[] NOT NULL DEFAULT '{}',
                created_at BIGINT NOT NULL,
                updated_at BIGINT,
                deleted_at BIGINT,
                UNIQUE(hand_id, sequence_index)
            )
        `;

        // Create indexes for hand_actions
        await sql`
            CREATE INDEX IF NOT EXISTS idx_hand_actions_hand_seq
                ON hand_actions(hand_id, sequence_index)
                WHERE deleted_at IS NULL
        `;

        await sql`
            CREATE INDEX IF NOT EXISTS idx_hand_actions_street
                ON hand_actions(hand_id, street)
                WHERE deleted_at IS NULL
        `;

        await sql`
            CREATE INDEX IF NOT EXISTS idx_hand_actions_tags
                ON hand_actions USING GIN(tags)
                WHERE deleted_at IS NULL
        `;

        // Enable Row Level Security
        await sql`ALTER TABLE hands ENABLE ROW LEVEL SECURITY`;
        await sql`ALTER TABLE hand_players ENABLE ROW LEVEL SECURITY`;
        await sql`ALTER TABLE hand_actions ENABLE ROW LEVEL SECURITY`;

        // RLS Policies for hands table
        await sql`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hands_select_policy' AND tablename = 'hands') THEN
                    CREATE POLICY hands_select_policy ON hands FOR SELECT
                    USING (owner_user_id = auth.user_id() AND deleted_at IS NULL);
                END IF;
            END $$
        `;

        await sql`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hands_insert_policy' AND tablename = 'hands') THEN
                    CREATE POLICY hands_insert_policy ON hands FOR INSERT
                    WITH CHECK (owner_user_id = auth.user_id());
                END IF;
            END $$
        `;

        await sql`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hands_update_policy' AND tablename = 'hands') THEN
                    CREATE POLICY hands_update_policy ON hands FOR UPDATE
                    USING (owner_user_id = auth.user_id() AND deleted_at IS NULL)
                    WITH CHECK (owner_user_id = auth.user_id());
                END IF;
            END $$
        `;

        await sql`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hands_delete_policy' AND tablename = 'hands') THEN
                    CREATE POLICY hands_delete_policy ON hands FOR DELETE
                    USING (owner_user_id = auth.user_id());
                END IF;
            END $$
        `;

        // RLS Policies for hand_players table
        await sql`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hand_players_select_policy' AND tablename = 'hand_players') THEN
                    CREATE POLICY hand_players_select_policy ON hand_players FOR SELECT
                    USING (
                        EXISTS (SELECT 1 FROM hands WHERE hands.id = hand_players.hand_id AND hands.owner_user_id = auth.user_id() AND hands.deleted_at IS NULL)
                        AND deleted_at IS NULL
                    );
                END IF;
            END $$
        `;

        await sql`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hand_players_insert_policy' AND tablename = 'hand_players') THEN
                    CREATE POLICY hand_players_insert_policy ON hand_players FOR INSERT
                    WITH CHECK (
                        EXISTS (SELECT 1 FROM hands WHERE hands.id = hand_players.hand_id AND hands.owner_user_id = auth.user_id())
                    );
                END IF;
            END $$
        `;

        await sql`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hand_players_update_policy' AND tablename = 'hand_players') THEN
                    CREATE POLICY hand_players_update_policy ON hand_players FOR UPDATE
                    USING (
                        EXISTS (SELECT 1 FROM hands WHERE hands.id = hand_players.hand_id AND hands.owner_user_id = auth.user_id() AND hands.deleted_at IS NULL)
                        AND deleted_at IS NULL
                    )
                    WITH CHECK (
                        EXISTS (SELECT 1 FROM hands WHERE hands.id = hand_players.hand_id AND hands.owner_user_id = auth.user_id())
                    );
                END IF;
            END $$
        `;

        await sql`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hand_players_delete_policy' AND tablename = 'hand_players') THEN
                    CREATE POLICY hand_players_delete_policy ON hand_players FOR DELETE
                    USING (
                        EXISTS (SELECT 1 FROM hands WHERE hands.id = hand_players.hand_id AND hands.owner_user_id = auth.user_id())
                    );
                END IF;
            END $$
        `;

        // RLS Policies for hand_actions table
        await sql`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hand_actions_select_policy' AND tablename = 'hand_actions') THEN
                    CREATE POLICY hand_actions_select_policy ON hand_actions FOR SELECT
                    USING (
                        EXISTS (SELECT 1 FROM hands WHERE hands.id = hand_actions.hand_id AND hands.owner_user_id = auth.user_id() AND hands.deleted_at IS NULL)
                        AND deleted_at IS NULL
                    );
                END IF;
            END $$
        `;

        await sql`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hand_actions_insert_policy' AND tablename = 'hand_actions') THEN
                    CREATE POLICY hand_actions_insert_policy ON hand_actions FOR INSERT
                    WITH CHECK (
                        EXISTS (SELECT 1 FROM hands WHERE hands.id = hand_actions.hand_id AND hands.owner_user_id = auth.user_id())
                    );
                END IF;
            END $$
        `;

        await sql`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hand_actions_update_policy' AND tablename = 'hand_actions') THEN
                    CREATE POLICY hand_actions_update_policy ON hand_actions FOR UPDATE
                    USING (
                        EXISTS (SELECT 1 FROM hands WHERE hands.id = hand_actions.hand_id AND hands.owner_user_id = auth.user_id() AND hands.deleted_at IS NULL)
                        AND deleted_at IS NULL
                    )
                    WITH CHECK (
                        EXISTS (SELECT 1 FROM hands WHERE hands.id = hand_actions.hand_id AND hands.owner_user_id = auth.user_id())
                    );
                END IF;
            END $$
        `;

        await sql`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hand_actions_delete_policy' AND tablename = 'hand_actions') THEN
                    CREATE POLICY hand_actions_delete_policy ON hand_actions FOR DELETE
                    USING (
                        EXISTS (SELECT 1 FROM hands WHERE hands.id = hand_actions.hand_id AND hands.owner_user_id = auth.user_id())
                    );
                END IF;
            END $$
        `;

        console.log("✅ Database schema initialized successfully");
    } catch (error: any) {
        console.error("❌ Error initializing database schema:", error);
        // Don't throw - allow server to continue, tables may already exist
    }
}

// Initialize database on module load
initializeDatabase().catch(console.error);

export default sql;
