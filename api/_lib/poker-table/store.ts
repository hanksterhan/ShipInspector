import type { TableState } from "./engine";

export type Query = (sql: string, params?: unknown[]) => Promise<Record<string, any>[]>;
// A single compare-and-swap UPDATE commits a whole hand transition. This works
// across serverless instances; process memory is never the source of truth.
export class TableStore {
  private initialized?: Promise<void>;
  constructor(private query: Query) {}
  async initialize() {
    if (!this.initialized) this.initialized = (async () => {
      await this.query(`CREATE TABLE IF NOT EXISTS poker_tables (
        id UUID PRIMARY KEY, version INTEGER NOT NULL, state JSONB NOT NULL,
        members TEXT[] NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);
      await this.query("CREATE INDEX IF NOT EXISTS poker_tables_members ON poker_tables USING GIN (members)");
    })().catch(error => { this.initialized = undefined; throw error; });
    return this.initialized;
  }
  async create(t: TableState) {
    await this.initialize();
    await this.query("INSERT INTO poker_tables (id, version, state, members) VALUES ($1, $2, $3::jsonb, $4::text[])", [t.id, t.version, JSON.stringify(t), t.members]);
  }
  async get(id: string): Promise<TableState | null> {
    await this.initialize();
    const rows = await this.query("SELECT state FROM poker_tables WHERE id = $1", [id]);
    return rows[0]?.state || null;
  }
  async list(principal: string): Promise<TableState[]> {
    await this.initialize();
    const rows = await this.query("SELECT state FROM poker_tables WHERE members @> ARRAY[$1]::text[] AND state->>'closed' = 'false' ORDER BY updated_at DESC LIMIT 50", [principal]);
    return rows.map(r => r.state);
  }
  async save(t: TableState, expected: number): Promise<boolean> {
    const rows = await this.query("UPDATE poker_tables SET state = $1::jsonb, version = $2, members = $3::text[], updated_at = now() WHERE id = $4 AND version = $5 RETURNING id", [JSON.stringify(t), t.version, t.members, t.id, expected]);
    return rows.length === 1;
  }
}
let store: Promise<TableStore> | undefined;
export function getTableStore(): Promise<TableStore> {
  if (!store) store = (async () => {
    if (process.env.POKER_STORE_DIR && !process.env.VERCEL && process.env.NODE_ENV !== "production") {
      const { PGlite } = await import("@electric-sql/pglite");
      const db = new PGlite(process.env.POKER_STORE_DIR);
      return new TableStore(async (sql, params) => (await db.query(sql, params)).rows);
    }
    if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL for multiplayer tables.");
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    return new TableStore(async (text, params) => await sql.query(text, params));
  })().catch(error => { store = undefined; throw error; });
  return store;
}
