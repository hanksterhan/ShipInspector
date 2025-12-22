import db from "../../config/database";
import { HandReplay } from "@common/interfaces";
import { v4 as uuidv4 } from "uuid";

/**
 * Repository for hand replay database operations
 */
export class ReplayRepository {
    /**
     * Save a new hand replay to the database
     */
    async saveReplay(replay: HandReplay): Promise<string> {
        const id = replay.id || uuidv4();
        const now = Date.now();
        const createdAt = replay.createdAt || now;
        const updatedAt = now;

        const stmt = db.prepare(`
            INSERT INTO hand_replays (
                id, title, date, created_at, updated_at,
                table_size, button_position, small_blind, big_blind,
                players, streets, board, dead_cards, winners, pot_distribution, showdown, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            id,
            replay.title || null,
            replay.date || null,
            createdAt,
            updatedAt,
            replay.tableSize,
            replay.buttonPosition,
            replay.smallBlind,
            replay.bigBlind,
            JSON.stringify(replay.players),
            JSON.stringify(replay.streets),
            JSON.stringify(replay.board),
            JSON.stringify(replay.deadCards),
            replay.winners ? JSON.stringify(replay.winners) : null,
            replay.potDistribution
                ? JSON.stringify(replay.potDistribution)
                : null,
            replay.showdown ? 1 : 0,
            null // metadata for future use
        );

        return id;
    }

    /**
     * Load a hand replay by ID
     */
    async loadReplay(id: string): Promise<HandReplay | null> {
        const stmt = db.prepare(`SELECT * FROM hand_replays WHERE id = ?`);
        const row = stmt.get(id) as any;

        if (!row) {
            return null;
        }

        return this.mapRowToReplay(row);
    }

    /**
     * Update an existing hand replay
     */
    async updateReplay(id: string, replay: HandReplay): Promise<boolean> {
        const now = Date.now();

        const stmt = db.prepare(`
            UPDATE hand_replays SET
                title = ?,
                date = ?,
                updated_at = ?,
                table_size = ?,
                button_position = ?,
                small_blind = ?,
                big_blind = ?,
                players = ?,
                streets = ?,
                board = ?,
                dead_cards = ?,
                winners = ?,
                pot_distribution = ?,
                showdown = ?
            WHERE id = ?
        `);

        const result = stmt.run(
            replay.title || null,
            replay.date || null,
            now,
            replay.tableSize,
            replay.buttonPosition,
            replay.smallBlind,
            replay.bigBlind,
            JSON.stringify(replay.players),
            JSON.stringify(replay.streets),
            JSON.stringify(replay.board),
            JSON.stringify(replay.deadCards),
            replay.winners ? JSON.stringify(replay.winners) : null,
            replay.potDistribution
                ? JSON.stringify(replay.potDistribution)
                : null,
            replay.showdown ? 1 : 0,
            id
        );

        return result.changes > 0;
    }

    /**
     * List hand replays with pagination and optional search
     */
    async listReplays(options: {
        limit?: number;
        offset?: number;
        search?: string;
    }): Promise<{ replays: HandReplay[]; total: number }> {
        const limit = options.limit || 50;
        const offset = options.offset || 0;
        const search = options.search?.trim();

        let query = `SELECT * FROM hand_replays`;
        const params: any[] = [];

        if (search) {
            query += ` WHERE title LIKE ?`;
            params.push(`%${search}%`);
        }

        // Get total count
        const countQuery = search
            ? `SELECT COUNT(*) as total FROM hand_replays WHERE title LIKE ?`
            : `SELECT COUNT(*) as total FROM hand_replays`;
        const countResult = db
            .prepare(countQuery)
            .get(...(search ? [`%${search}%`] : [])) as { total: number };
        const total = countResult.total;

        // Get paginated results
        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const stmt = db.prepare(query);
        const rows = stmt.all(...params) as any[];

        const replays = rows.map((row) => this.mapRowToReplay(row));

        return { replays, total };
    }

    /**
     * Delete a hand replay by ID
     */
    async deleteReplay(id: string): Promise<boolean> {
        const stmt = db.prepare(`DELETE FROM hand_replays WHERE id = ?`);
        const result = stmt.run(id);
        return result.changes > 0;
    }

    /**
     * Map database row to HandReplay object
     */
    private mapRowToReplay(row: any): HandReplay {
        return {
            id: row.id,
            title: row.title || undefined,
            date: row.date || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            tableSize: row.table_size,
            buttonPosition: row.button_position,
            smallBlind: row.small_blind,
            bigBlind: row.big_blind,
            players: JSON.parse(row.players),
            streets: JSON.parse(row.streets),
            board: JSON.parse(row.board),
            deadCards: JSON.parse(row.dead_cards),
            winners: row.winners ? JSON.parse(row.winners) : undefined,
            potDistribution: row.pot_distribution
                ? JSON.parse(row.pot_distribution)
                : undefined,
            showdown: row.showdown === 1 ? true : undefined,
        };
    }
}

export const replayRepository = new ReplayRepository();
