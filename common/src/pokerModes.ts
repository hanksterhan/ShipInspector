export const GAME_MODES = ["holdem", "red-river-holdem"] as const;
export type GameMode = (typeof GAME_MODES)[number];
export type TerminalReason = "river-complete" | "black-river" | "deck-exhausted" | "uncontested";

export interface GameDefinition {
  readonly id: GameMode;
  readonly rulesVersion: 1;
  readonly label: string;
  readonly holeCards: 2;
  readonly betting: "no-limit";
  readonly selection: "any-five";
  readonly ranking: "standard-high";
  readonly riverContinuation: "never" | "red";
  readonly burnCards: 1;
  readonly exhaustion: "showdown-current-board";
  readonly supportsLegacyStudy: boolean;
}

const definitions: Record<GameMode, GameDefinition> = {
  holdem: Object.freeze({
    id: "holdem", rulesVersion: 1, label: "No-limit Hold'em", holeCards: 2,
    betting: "no-limit", selection: "any-five", ranking: "standard-high",
    riverContinuation: "never", burnCards: 1, exhaustion: "showdown-current-board",
    supportsLegacyStudy: true,
  }),
  "red-river-holdem": Object.freeze({
    id: "red-river-holdem", rulesVersion: 1, label: "Red River Hold'em", holeCards: 2,
    betting: "no-limit", selection: "any-five", ranking: "standard-high",
    riverContinuation: "red", burnCards: 1, exhaustion: "showdown-current-board",
    supportsLegacyStudy: false,
  }),
};

// Ghost modifier rules: one hidden two-card hand that contests every showdown
// pot, even one with a single eligible player. Clients that omit this token cannot
// read or act on a ghost table.
export const GHOST_RULES = "ghost:1";
export const SUPPORTED_POKER_RULES = [...GAME_MODES.map(mode => `${mode}:${definitions[mode].rulesVersion}`), GHOST_RULES].join(",");

export function modeLabel(mode: GameMode = "holdem", ghost = false): string {
  return `${gameDefinition(mode).label}${ghost ? " · Ghost" : ""}`;
}

export function gameDefinition(mode: GameMode = "holdem", rulesVersion = 1): GameDefinition {
  if (!Object.prototype.hasOwnProperty.call(definitions, mode)) throw new Error("Unsupported poker mode.");
  const definition = definitions[mode];
  if (rulesVersion !== definition.rulesVersion) throw new Error("Unsupported poker rules version.");
  return definition;
}
