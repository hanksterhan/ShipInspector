import { gameDefinition } from "@common/pokerModes";
import { readHandRecord } from "./history";
import { TableError, type TableState } from "./engine";

export function readTableState(raw: TableState): TableState {
  if (!raw || !raw.settings || !Array.isArray(raw.board) || !Array.isArray(raw.seats) || !Array.isArray(raw.deck)) {
    throw new TableError("Invalid saved table state.", 409);
  }
  const legacy = raw.stateFormatVersion === undefined;
  if (!legacy && raw.stateFormatVersion !== 1) throw new TableError("Unsupported saved table format.", 409);
  if (legacy && raw.settings.gameMode && raw.settings.gameMode !== "holdem") {
    throw new TableError("A legacy table cannot use new poker rules.", 409);
  }
  let rules;
  try { rules = gameDefinition(raw.settings.gameMode, legacy ? 1 : raw.rulesVersion); }
  catch (error) { throw new TableError((error as Error).message, 409); }
  if (!legacy) {
    if (!raw.settings.gameMode) throw new TableError("Missing saved poker mode.", 409);
    if (raw.rulesVersion !== 1 || [raw.roundId, raw.riverNumber, raw.dealtPlayerCount, raw.burnCount]
      .some(n => !Number.isSafeInteger(n) || n < 0)) throw new TableError("Invalid saved hand metadata.", 409);
    if (raw.handRecord) {
      const record = readHandRecord(raw.handRecord);
      if (record.handNumber !== raw.handNumber || record.gameMode !== rules.id || record.rulesVersion !== raw.rulesVersion) {
        throw new TableError("Invalid saved hand metadata.", 409);
      }
    }
    return { ...raw, handRecord: raw.handRecord ?? null };
  }
  const burns = raw.board.length >= 5 ? 3 : raw.board.length === 4 ? 2 : raw.board.length === 3 ? 1 : 0;
  return { ...raw, handRecord: null, settings: { ...raw.settings, gameMode: rules.id }, stateFormatVersion: 1,
    rulesVersion: rules.rulesVersion, roundId: raw.handNumber ? burns + 1 : 0,
    riverNumber: raw.board.length >= 5 ? 1 : 0, burnCount: burns,
    dealtPlayerCount: raw.seats.filter(s => s.status !== "waiting").length,
    terminalReason: raw.street === "complete" ? (raw.board.length === 5 ? "river-complete" : "uncontested") : null };
}
