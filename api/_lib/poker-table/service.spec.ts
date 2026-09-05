import { PGlite } from "@electric-sql/pglite";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TableStore } from "./store";
import { Identity, TableService } from "./service";
import type { TableCommand, TableView } from "@common/interfaces/tableInterfaces";

const settings = { name: "Private table", maxPlayers: 8, smallBlind: 5, bigBlind: 10, startingStack: 1000, turnSeconds: 30 };
describe("persistent tables and shared human/agent authorization", () => {
  let db: PGlite; let store: TableStore; let service: TableService; let clock: number;
  beforeAll(async () => {
    db = new PGlite();
    store = new TableStore(async (sql, params) => (await db.query(sql, params)).rows);
    await store.initialize();
  }, 30000);
  beforeEach(() => { clock = 1000; service = new TableService(store, () => clock); });
  afterAll(async () => { await db.close(); });
  const send = (v: TableView, who: Identity, command: TableCommand, requestId = randomUUID()) => service.command(v.id, who, { version: v.version, requestId, command });
  it("persists state across service instances and isolates the private table list", async () => {
    const v = await service.create("owner-a", settings, "Alice");
    const restarted = new TableService(new TableStore(async (sql, params) => (await db.query(sql, params)).rows), () => clock);
    expect((await restarted.get(v.id, { userId: "owner-a" })).seats[0].name).toBe("Alice");
    expect(await restarted.list("stranger")).toEqual([]);
    await expect(restarted.get(v.id, { userId: "stranger" })).rejects.toThrow("Join this private table");
  });
  it("recovers a game after closing and reopening a disk database", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ship-poker-persistence-"));
    let disk = await PGlite.create(directory);
    try {
      const firstStore = new TableStore(async (sql, params) => (await disk.query(sql, params)).rows);
      const first = new TableService(firstStore);
      const saved = await first.create("disk-player", settings, "Alice");
      await first.command(saved.id, { userId: "disk-player" }, { version: saved.version, requestId: randomUUID(), command: { type: "ready", ready: true } });
      await disk.close();
      disk = await PGlite.create(directory);
      const restored = await new TableService(new TableStore(async (sql, params) => (await disk.query(sql, params)).rows)).get(saved.id, { userId: "disk-player" });
      expect(restored.version).toBe(1); expect(restored.seats[0].ready).toBe(true);
    } finally { await disk.close(); await rm(directory, { recursive: true, force: true }); }
  });
  it("commits one of two simultaneous writes and accepts an exact retry once", async () => {
    const v = await service.create("race-owner", settings, "Alice");
    const requestId = randomUUID();
    const results = await Promise.allSettled([send(v, { userId: "race-owner" }, { type: "ready", ready: true }, requestId), send(v, { userId: "race-owner" }, { type: "ready", ready: false })]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    const current = await service.get(v.id, { userId: "race-owner" });
    expect(current.version).toBe(v.version + 1);
    if ((await store.get(v.id))!.receipts.some(r => r.key.endsWith(requestId))) {
      expect((await send(v, { userId: "race-owner" }, { type: "ready", ready: true }, requestId)).version).toBe(current.version);
      await expect(send(current, { userId: "race-owner" }, { type: "ready", ready: false }, requestId)).rejects.toThrow("different action");
    }
  });
  it("shares one game between humans and agents without exposing their cards", async () => {
    let v = await service.create("mixed-owner", settings, "Alice");
    const issued = await service.issueAgent(v.id, "mixed-owner", v.version, randomUUID(), "Bot");
    const bot = { token: issued.token }; v = issued.table;
    expect(JSON.stringify(await store.get(v.id))).not.toContain(issued.token);
    expect(JSON.stringify(v)).not.toContain("hash");
    v = await send(v, { userId: "mixed-owner" }, { type: "ready", ready: true });
    v = await send(v, bot, { type: "ready", ready: true });
    v = await send(v, bot, { type: "deal" });
    expect(v.yourSeat).toBe(1); expect(v.seats[0].cards).toEqual([]); expect(v.seats[1].cards).toHaveLength(2);
    const human = await service.get(v.id, { userId: "mixed-owner" });
    expect(human.seats[1].cards).toEqual([]); expect(human.seats[0].cards).toHaveLength(2);
    await expect(send(v, bot, { type: "act", action: "fold" })).rejects.toThrow("not your turn");
    v = await send(human, { userId: "mixed-owner" }, { type: "act", action: "call" });
    v = await send(v, bot, { type: "act", action: "check" }); expect(v.street).toBe("flop");
    await expect(service.issueAgent(v.id, "stranger", v.version, randomUUID(), "Intruder")).rejects.toThrow("host");
  });
  it("rejects expired, revoked, and cross-table credentials", async () => {
    const first = await service.create("token-owner", settings);
    const grant = await service.issueAgent(first.id, "token-owner", first.version, randomUUID(), "Bot");
    const second = await service.create("token-owner", settings);
    await expect(service.get(second.id, { token: grant.token })).rejects.toThrow("invalid");
    clock += 7 * 86400000;
    await expect(service.get(first.id, { token: grant.token })).rejects.toThrow("expired");
    clock = 1000;
    await service.revokeAgent(first.id, "token-owner", grant.table.version, randomUUID(), grant.agentId);
    await expect(service.get(first.id, { token: grant.token })).rejects.toThrow("revoked");
  });
  it("distinguishes a revoked seat from a new agent with the same name", async () => {
    const t = await service.create("replacement-owner", settings);
    const first = await service.issueAgent(t.id, "replacement-owner", t.version, randomUUID(), "Bot");
    const revoked = await service.revokeAgent(t.id, "replacement-owner", first.table.version, randomUUID(), first.agentId);
    const replacement = await service.issueAgent(t.id, "replacement-owner", revoked.version, randomUUID(), "Bot");
    expect(replacement.table.agents.map(a => ({ revoked: a.revoked, seated: a.seated }))).toEqual([{ revoked: true, seated: false }, { revoked: false, seated: true }]);
  });
  it("rejects stale actions and saves a timeout before a reconnect", async () => {
    let v = await service.create("timeout-owner", settings, "Alice");
    v = await send(v, { userId: "bob" }, { type: "join", name: "Bob" });
    v = await send(v, { userId: "timeout-owner" }, { type: "ready", ready: true });
    v = await send(v, { userId: "bob" }, { type: "ready", ready: true });
    v = await send(v, { userId: "timeout-owner" }, { type: "deal" });
    clock += 31000;
    const reconnected = await service.get(v.id, { userId: "bob" });
    expect(reconnected.street).toBe("complete"); expect(reconnected.seats[0].sittingOut).toBe(true);
    await expect(send(v, { userId: "timeout-owner" }, { type: "act", action: "raise", raiseTo: 100 })).rejects.toThrow("table changed");
    expect((await store.get(v.id))!.version).toBe(v.version + 1);
  });
});
