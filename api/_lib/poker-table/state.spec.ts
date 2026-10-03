import { parseCard } from "@common/interfaces";
import { act, applyCommand, deal, joinSeat, makeTable, tableView, type TableState } from "./engine";
import { TableStore } from "./store";

const settings = { name: "Legacy", maxPlayers: 4, smallBlind: 5, bigBlind: 10, startingStack: 1000, turnSeconds: 30 };
function saved(): TableState {
  const t = makeTable("saved", "one", settings);
  for (const id of ["one", "two"]) { joinSeat(t, id, id); applyCommand(t, id, { type: "ready", ready: true }, 0); }
  deal(t, 0); return t;
}
const load = (state: TableState) => new TableStore(async sql => sql.startsWith("SELECT") ? [{ state }] : []).get("saved");
describe("saved table format compatibility", () => {
  it("loads an old red-river Hold'em hand without changing its mode, deck or mutation version", async () => {
    const t = saved();
    t.street = "river"; t.board = "2c 3d 4h 5s 6h".split(" ").map(parseCard); t.version = 17;
    joinSeat(t, "late", "Late");
    for (const key of ["stateFormatVersion", "rulesVersion", "roundId", "riverNumber", "burnCount", "dealtPlayerCount", "terminalReason"]) delete t[key];
    delete t.settings.gameMode;
    const restored = (await load(t))!;
    expect(restored).toMatchObject({ version: 17, settings: { gameMode: "holdem" }, roundId: 4, riverNumber: 1, burnCount: 3, dealtPlayerCount: 2 });
    expect(restored.deck).toEqual(t.deck);
    expect(restored.seats).toEqual(t.seats);
    expect(tableView(restored, "one", 1).rulesVersion).toBe(1);
  });
  it.each([
    ["stateFormatVersion", 2, "format"], ["rulesVersion", 2, "rules version"],
    ["roundId", -1, "metadata"], ["burnCount", undefined, "metadata"],
  ])("rejects unsupported or incomplete saved %s", async (field, value, message) => {
    const t = saved(); t[field as string] = value;
    await expect(load(t)).rejects.toThrow(message as string);
  });
  it("rejects missing or unknown saved modes", async () => {
    const t = saved(); delete t.settings.gameMode;
    await expect(load(t)).rejects.toThrow("Missing saved poker mode");
    t.settings.gameMode = "unknown" as any;
    await expect(load(t)).rejects.toThrow("Unsupported poker mode");
  });
  it("rejects newer or inconsistent hand records before a private table projection", async () => {
    for (const change of [
      (t: TableState) => { t.handRecord!.formatVersion = 2 as any; },
      (t: TableState) => { t.handRecord!.rulesVersion = 2; },
      (t: TableState) => { t.handRecord!.handNumber++; },
      (t: TableState) => { t.handRecord!.settings.gameMode = "red-river-holdem"; },
    ]) {
      const t = saved(); change(t);
      await expect(load(t)).rejects.toThrow(/not supported|unsupported rules|metadata/);
    }
  });
  it("tracks rounds and original participants without counting late seats", () => {
    const t = saved(); joinSeat(t, "late", "Late");
    act(t, "one", "call", undefined, 1); act(t, "two", "check", undefined, 2);
    expect(tableView(t, "one", 2)).toMatchObject({ roundId: 2, burnCount: 1, dealtPlayerCount: 2, riverNumber: 0 });
  });
});
