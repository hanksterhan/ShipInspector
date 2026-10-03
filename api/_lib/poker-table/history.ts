import type { HandEventBody, HandPlayer, TableHandRecord } from "@common/interfaces/tableHandInterfaces";
import { gameDefinition } from "@common/pokerModes";
import type { TableState } from "./engine";

type PrivatePlayer = Omit<HandPlayer, "isYou"> & { principal: string };
export type PrivateHandRecord = Omit<TableHandRecord, "players"> & { players: PrivatePlayer[] };

export function startHandRecord(t: TableState) {
  t.handRecord = { formatVersion: 1, handNumber: t.handNumber, gameMode: gameDefinition(t.settings.gameMode).id,
    rulesVersion: t.rulesVersion, settings: { ...t.settings }, button: t.button,
    smallBlindSeat: t.smallBlindSeat ?? null, bigBlindSeat: t.bigBlindSeat ?? null,
    players: t.seats.filter(s => s.status !== "waiting").map(s => ({ seat: s.seat, principal: s.principal,
      name: s.name, kind: s.kind, startingStack: s.stack + s.committed, cards: s.cards.map(c => ({ ...c })) })), events: [] };
  handEvent(t, { type: "start" });
  for (const [seat, blind] of [[t.smallBlindSeat, "small"], [t.bigBlindSeat, "big"]] as const) {
    const s = t.seats.find(s => s.seat === seat)!;
    handEvent(t, { type: "blind", seat: s.seat, blind, amount: s.bet });
  }
}
export function handEvent(t: TableState, body: HandEventBody) {
  if (!t.handRecord) return; // A legacy hand has no reconstructed history.
  t.handRecord.events.push({ ...JSON.parse(JSON.stringify(body)), sequence: t.handRecord.events.length,
    roundId: t.roundId, street: t.street });
}
export function handRecordView(record: PrivateHandRecord, principal: string): TableHandRecord {
  const end = record.events.find(e => e.type === "end");
  const revealed = end?.type === "end" ? end.revealedSeats : [];
  return { ...record, events: JSON.parse(JSON.stringify(record.events)), players: record.players.map(({ principal: owner, cards, ...player }) => ({
    ...player, isYou: owner === principal,
    cards: owner === principal || revealed.includes(player.seat) ? cards.map(c => ({ ...c })) : [],
  })) };
}
