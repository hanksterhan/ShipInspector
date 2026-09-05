import type { Card } from "@common/interfaces";
import { parseCard } from "@common/interfaces";

/** Portable analysis input. It contains known cards only, never live game secrets. */
export interface StudyScenario {
  version: 1;
  variant: "texas-holdem";
  players: { seat: number; cards: [Card | null, Card | null] }[];
  board: [Card | null, Card | null, Card | null, Card | null, Card | null];
}

export function parseScenario(value: unknown): StudyScenario {
  const data = value as StudyScenario;
  if (!data || data.version !== 1 || data.variant !== "texas-holdem")
    throw new Error("Use a version 1 Texas Hold’em study file.");
  if (
    !Array.isArray(data.players) ||
    data.players.length < 2 ||
    data.players.length > 8 ||
    !Array.isArray(data.board) ||
    data.board.length !== 5
  )
    throw new Error("A study needs 2–8 players and 5 board slots.");
  const seenCards = new Set<string>();
  const seenSeats = new Set<number>();
  function checkCard(card: Card | null): Card | null {
    if (card === null) return null;
    if (
      !card ||
      !Number.isInteger(card.rank) ||
      card.rank < 2 ||
      card.rank > 14 ||
      !["h", "s", "d", "c"].includes(card.suit)
    )
      throw new Error("The study contains an invalid card.");
    const key = `${card.rank}${card.suit}`;
    if (seenCards.has(key)) throw new Error("Each card can appear only once.");
    seenCards.add(key);
    return { rank: card.rank, suit: card.suit };
  }
  const players = data.players.map((player) => {
    if (
      !player ||
      !Number.isInteger(player.seat) ||
      player.seat < 0 ||
      player.seat > 7 ||
      seenSeats.has(player.seat) ||
      !Array.isArray(player.cards) ||
      player.cards.length !== 2
    )
      throw new Error("Each player needs a unique seat and 2 card slots.");
    seenSeats.add(player.seat);
    return {
      seat: player.seat,
      cards: player.cards.map(checkCard) as [Card | null, Card | null],
    };
  });
  const board = data.board.map(checkCard) as StudyScenario["board"];
  const count = board.filter(Boolean).length;
  if (![0, 3, 4, 5].includes(count) || board.slice(0, count).some((c) => !c))
    throw new Error("Use a complete flop before adding the turn or river.");
  return { version: 1, variant: "texas-holdem", players, board };
}

function example(hands: string[][], board: string[]): StudyScenario {
  return {
    version: 1,
    variant: "texas-holdem",
    players: hands.map((cards, seat) => ({
      seat,
      cards: cards.map(parseCard) as [Card, Card],
    })),
    board: Array.from({ length: 5 }, (_, index) =>
      board[index] ? parseCard(board[index]) : null,
    ) as StudyScenario["board"],
  };
}

export const STUDY_EXAMPLES = [
  {
    label: "Aces vs kings",
    stage: "Preflop",
    scenario: example(
      [
        ["14s", "14h"],
        ["13s", "13h"],
      ],
      [],
    ),
  },
  {
    label: "The flush draw",
    stage: "Flop",
    scenario: example(
      [
        ["14h", "12h"],
        ["13s", "13d"],
      ],
      ["11h", "7h", "2c"],
    ),
  },
  {
    label: "River showdown",
    stage: "River",
    scenario: example(
      [
        ["14h", "12h"],
        ["13s", "13d"],
      ],
      ["11h", "7h", "2c", "9s", "3h"],
    ),
  },
] as const;
