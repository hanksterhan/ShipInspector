import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { TableCommandRequest, TableSettings, TableView } from "@common/interfaces/tableInterfaces";
import { applyCommand, expireTurn, joinSeat, makeTable, record, TableError, tableView, TableState } from "./engine";
import { TableStore } from "./store";

export type Identity = { userId: string; token?: never } | { token: string; userId?: never };
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export class TableService {
  constructor(private store: TableStore, private now = Date.now) {}
  private principal(t: TableState, identity: Identity): string {
    if (identity.userId) return identity.userId;
    const tokenHash = hash(identity.token || "");
    const grant = t.agents.find(g => timingSafeEqual(Buffer.from(g.hash), Buffer.from(tokenHash)));
    if (!grant || grant.revoked || grant.expiresAt <= this.now()) throw new TableError("Agent credential is invalid, expired, or revoked.", 401);
    return `agent:${grant.id}`;
  }
  private async load(id: string) {
    const t = await this.store.get(id);
    if (!t) throw new TableError("Table not found.", 404);
    return t;
  }
  async list(userId: string) {
    return (await this.store.list(userId)).map(t => ({ id: t.id, name: t.settings.name, seats: t.seats.length,
      maxPlayers: t.settings.maxPlayers, smallBlind: t.settings.smallBlind, bigBlind: t.settings.bigBlind, street: t.street }));
  }
  async create(userId: string, settings: TableSettings, name?: string) {
    if ((await this.store.list(userId)).filter(t => t.owner === userId).length >= 20) throw new TableError("Close an existing table before creating another.", 409);
    const t = makeTable(randomUUID(), userId, settings);
    if (name) joinSeat(t, userId, name);
    await this.store.create(t);
    return tableView(t, userId, this.now());
  }
  async get(id: string, identity: Identity): Promise<TableView> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const t = await this.load(id); const principal = this.principal(t, identity);
      if (!t.members.includes(principal)) throw new TableError("Join this private table to view the game.", 403);
      const expected = t.version;
      if (expireTurn(t, this.now())) {
        t.version++;
        if (!await this.store.save(t, expected)) continue;
      }
      return tableView(t, principal, this.now());
    }
    throw new TableError("The table changed. Refresh and try again.", 409);
  }
  async command(id: string, identity: Identity, input: TableCommandRequest) {
    return this.mutate(id, identity, input.version, input.requestId, input.command, (t, principal) => {
      if (!t.members.includes(principal) && input.command.type !== "join") throw new TableError("Join this table first.", 403);
      if (identity.token && input.command.type === "join") throw new TableError("Agent credentials already have a reserved seat.");
      applyCommand(t, principal, input.command, this.now());
    });
  }
  private async mutate(id: string, identity: Identity, version: number, requestId: string, payload: unknown,
    change: (t: TableState, principal: string) => void): Promise<TableView> {
    const t = await this.load(id); const principal = this.principal(t, identity);
    const key = `${principal}:${requestId}`; const digest = hash(JSON.stringify(payload));
    const receipt = t.receipts.find(r => r.key === key);
    if (receipt) {
      if (receipt.digest !== digest) throw new TableError("This request ID was used for a different action.", 409);
      return tableView(t, principal, this.now());
    }
    const expected = t.version;
    // A join uses the invite ID and has no private snapshot yet. CAS still
    // prevents two people from taking the same final seat.
    const joining = (payload as { type?: string })?.type === "join";
    if (!joining && expected !== version) throw new TableError("The table changed. Refresh before acting.", 409);
    if (expireTurn(t, this.now())) {
      t.version++;
      await this.store.save(t, expected);
      throw new TableError("The turn expired. Refresh before acting.", 409);
    }
    change(t, principal);
    t.version++;
    t.receipts.push({ key, digest }); t.receipts = t.receipts.slice(-256);
    if (!await this.store.save(t, expected)) throw new TableError("Another action reached the table first. Refresh and try again.", 409);
    return tableView(t, principal, this.now());
  }
  async issueAgent(id: string, userId: string, version: number, requestId: string, name: string) {
    const token = `si_agent_${id}.${randomBytes(32).toString("hex")}`;
    const grantId = randomUUID();
    let created = false;
    const table = await this.mutate(id, { userId }, version, requestId, { type: "issue-agent", name }, (t, principal) => {
      if (t.owner !== principal) throw new TableError("Only the host can reserve an agent seat.", 403);
      if (t.agents.length >= 32) throw new TableError("This table has reached its credential limit. Create a new table.", 409);
      joinSeat(t, `agent:${grantId}`, name, "agent");
      const seat = t.seats.find(s => s.principal === `agent:${grantId}`)!.seat;
      t.agents.push({ id: grantId, name, seat, hash: hash(token), expiresAt: this.now() + 7 * 86400000, revoked: false });
      created = true;
    });
    if (!created) throw new TableError("This credential was already issued. Revoke it and create another if you did not save it.", 409);
    return { table, token, agentId: grantId };
  }
  async revokeAgent(id: string, userId: string, version: number, requestId: string, agentId: string) {
    return this.mutate(id, { userId }, version, requestId, { type: "revoke-agent", agentId }, (t, principal) => {
      if (t.owner !== principal) throw new TableError("Only the host can revoke an agent credential.", 403);
      const grant = t.agents.find(a => a.id === agentId);
      if (!grant) throw new TableError("Agent not found.", 404);
      grant.revoked = true;
      const seat = t.seats.find(s => s.principal === `agent:${grant.id}`);
      if (seat) {
        seat.ready = false; seat.sittingOut = true;
        if (["waiting", "complete"].includes(t.street) || seat.status === "waiting") applyCommand(t, seat.principal, { type: "leave" }, this.now());
      }
      record(t, `${grant.name} access revoked.`);
    });
  }
}
