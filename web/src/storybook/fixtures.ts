import type {
  Card,
  CardRank,
  CardSuit,
  HandForPlayback,
} from "@common/interfaces";
import type {
  TableView,
  TableSeatView,
} from "@common/interfaces/tableInterfaces";
import type { HandListItem } from "@/services/handService";

export const fixtureTime = Date.UTC(2026, 8, 5, 12);
export const card = (rank: CardRank, suit: CardSuit): Card => ({ rank, suit });
export const board = () => [
  card(2, "h"),
  card(7, "d"),
  card(11, "c"),
  card(9, "s"),
  card(3, "c"),
];
export const deck = () =>
  (["s", "h", "d", "c"] as CardSuit[]).flatMap((suit) =>
    Array.from({ length: 13 }, (_, n) => card((n + 2) as CardRank, suit)),
  );

export function table(overrides: Partial<TableView> = {}): TableView {
  return {
    id: "storybook-table",
    version: 1,
    settings: {
      gameMode: "holdem",
      name: "Friday table",
      maxPlayers: 8,
      smallBlind: 5,
      bigBlind: 10,
      startingStack: 1000,
      turnSeconds: 30,
    },
    isOwner: true,
    yourSeat: 0,
    street: "preflop",
    handNumber: 1,
    button: 0,
    smallBlindSeat: 0,
    bigBlindSeat: 1,
    actor: 0,
    deadline: Date.now() + 30000,
    serverTime: Date.now(),
    board: [],
    pot: 15,
    currentBet: 10,
    legal: {
      fold: true,
      check: false,
      call: 5,
      minRaiseTo: 20,
      maxRaiseTo: 1000,
    },
    awards: [],
    events: [{ id: 1, hand: 1, text: "Alex posted small blind 5" }],
    canDeal: false,
    closed: false,
    agents: [],
    seats: tableSeats(2),
    ...overrides,
  };
}

export function tableSeats(count = 8): TableSeatView[] {
  return ["Alex", "Marina", "Vega", "Rico", "Ziggy", "Robin", "Sam", "Jordan"]
    .slice(0, count)
    .map<TableSeatView>((name, seat) => ({
      seat,
      name,
      kind: seat === 1 ? "cpu" : "human",
      ...(seat === 1 ? { botStyle: "passive" as const } : {}),
      stack: 1000 - (seat === 0 ? 5 : seat === 1 ? 10 : 0),
      bet: seat === 0 ? 5 : seat === 1 ? 10 : 0,
      committed: seat === 0 ? 5 : seat === 1 ? 10 : 0,
      status: "active",
      ready: true,
      sittingOut: false,
      isYou: seat === 0,
      cards: seat === 0 ? [card(14, "s"), card(13, "s")] : [],
      hasCards: true,
      lastAction: "",
    }));
}

// Ghost tables copy the API engine's view of stacked decks: button on seat 0,
// the shared board, and Alex bets 50 on the flop. Each pot is the committed
// chips plus dead money, and each award pays the whole pot.
const ghostSeats = (
  stack: [number, number],
  committed: number,
  cards: [Card[], Card[]],
  status: TableSeatView["status"] = "active",
  lastAction: [string, string] = ["Check", "Check"],
) =>
  tableSeats(2).map((s, i) => ({
    ...s,
    stack: stack[i],
    bet: 0,
    committed,
    status,
    cards: cards[i],
    hasCards: status !== "waiting",
    lastAction: lastAction[i],
  }));
const ghostEnd = {
  street: "complete" as const,
  board: board(),
  actor: null,
  deadline: null,
  legal: null,
  currentBet: 0,
  riverNumber: 1,
};
/** Aces and kings lose the 120-chip pot to the ghost's set of nines. */
export function ghostShowdown(
  gameMode: TableView["settings"]["gameMode"] = "holdem",
): TableView {
  return table({
    ...ghostEnd,
    settings: { ...table().settings, gameMode, ghost: true },
    terminalReason: gameMode === "holdem" ? "river-complete" : "black-river",
    pot: 120,
    // The engine's last four events of the hand.
    events: [
      "River 1 dealt.",
      "Marina: Check.",
      "Alex: Check.",
      "Ghost wins 120 chips (Three of a kind). They carry to the next hand.",
    ].map((text, i) => ({ id: i + 13, hand: 1, text })),
    seats: ghostSeats([940, 940], 60, [
      [card(14, "s"), card(14, "d")],
      [card(13, "s"), card(13, "h")],
    ]),
    awards: [
      {
        amount: 120,
        winners: [],
        ghost: { amount: 120, hand: "Three of a kind" },
      },
    ],
    ghost: {
      carry: 120,
      deadMoney: 0,
      hasCards: true,
      cards: [card(9, "h"), card(9, "c")],
    },
  });
}
/** 45 dead money: Alex's A-K ties the ghost's A-K; the ghost takes the floor share. */
export function ghostSplit(): TableView {
  return table({
    ...ghostEnd,
    settings: { ...table().settings, ghost: true },
    terminalReason: "river-complete",
    pot: 165,
    seats: ghostSeats([1023, 940], 60, [
      [card(14, "s"), card(13, "s")],
      [card(4, "d"), card(5, "s")],
    ]),
    awards: [
      {
        amount: 165,
        winners: [{ seat: 0, amount: 83, hand: "High card" }],
        ghost: { amount: 82, hand: "High card" },
      },
    ],
    ghost: {
      carry: 82,
      deadMoney: 45,
      hasCards: true,
      cards: [card(14, "c"), card(13, "c")],
    },
  });
}
/** The split hand on the flop: Marina checked and Alex acts. */
export function ghostHidden(): TableView {
  return table({
    settings: { ...table().settings, ghost: true },
    street: "flop",
    board: board().slice(0, 3),
    pot: 65,
    currentBet: 0,
    legal: {
      fold: true,
      check: true,
      call: 0,
      minRaiseTo: 10,
      maxRaiseTo: 990,
    },
    seats: ghostSeats(
      [990, 990],
      10,
      [[card(14, "s"), card(13, "s")], []],
      "active",
      ["", "Check"],
    ),
    ghost: { carry: 0, deadMoney: 45, hasCards: true, cards: [] },
  });
}
/** A third player checked down and left after the ghost won the 30-chip pot. */
export function ghostCarry(): TableView {
  return table({
    settings: { ...table().settings, ghost: true },
    street: "waiting",
    actor: null,
    deadline: null,
    legal: null,
    pot: 0,
    currentBet: 0,
    smallBlindSeat: null,
    bigBlindSeat: null,
    seats: ghostSeats([990, 990], 0, [[], []], "waiting"),
    ghost: { carry: 30, deadMoney: 0, hasCards: false, cards: [] },
  });
}

export function handList(count = 6): HandListItem[] {
  return Array.from({ length: count }, (_, n) => ({
    id: `storybook-hand-${n}`,
    table_size: n % 2 ? 9 : 6,
    button_seat: n % 6,
    small_blind: 5,
    big_blind: n % 2 ? 20 : 10,
    ante: 0,
    board_flop_1: "2h",
    board_flop_2: "7d",
    board_flop_3: "11c",
    board_turn: n % 2 ? "9s" : null,
    board_river: n % 3 ? "3c" : null,
    created_at: fixtureTime - n * 86400000,
  }));
}

export function replayHand(players = 6): HandForPlayback {
  const id = "storybook-hand-0";
  const metadata = {
    created_at: fixtureTime,
    updated_at: null,
    deleted_at: null,
  };
  const steps: Array<
    Pick<
      HandForPlayback["actions"][number],
      "action_type" | "actor_seat" | "amount" | "street"
    >
  > = [
    { action_type: "POST_SB", actor_seat: 0, amount: 5, street: "preflop" },
    { action_type: "POST_BB", actor_seat: 1, amount: 10, street: "preflop" },
    { action_type: "CALL", actor_seat: 0, amount: 5, street: "preflop" },
    {
      action_type: "DEAL_FLOP",
      actor_seat: null,
      amount: null,
      street: "flop",
    },
    { action_type: "CHECK", actor_seat: 1, amount: null, street: "flop" },
    { action_type: "BET", actor_seat: 0, amount: 20, street: "flop" },
    { action_type: "CALL", actor_seat: 1, amount: 20, street: "flop" },
    {
      action_type: "DEAL_TURN",
      actor_seat: null,
      amount: null,
      street: "turn",
    },
    { action_type: "CHECK", actor_seat: 0, amount: null, street: "turn" },
    {
      action_type: "DEAL_RIVER",
      actor_seat: null,
      amount: null,
      street: "river",
    },
    { action_type: "REVEAL", actor_seat: 0, amount: null, street: "river" },
    { action_type: "COLLECT", actor_seat: 0, amount: 60, street: "river" },
  ];
  const actions = steps.map((action, sequence_index) => ({
    ...metadata,
    id: `action-${sequence_index}`,
    hand_id: id,
    sequence_index,
    raise_to: null,
    decision_ms: null,
    tags: [],
    ...action,
  }));
  return {
    hand: {
      ...metadata,
      ...handList(1)[0],
      id,
      owner_user_id: "storybook-user",
      table_size: players,
      board_turn: "9s",
      board_river: "3c",
    },
    players: Array.from({ length: players }, (_, seat_index) => ({
      ...metadata,
      id: `player-${seat_index}`,
      hand_id: id,
      seat_index,
      display_name: [
        "Alex",
        "Marina",
        "Vega",
        "Rico",
        "Sam",
        "Robin",
        "Jordan",
        "Lee",
        "Casey",
      ][seat_index],
      stack_at_start: 1000,
      is_hero: seat_index === 0,
      showdown_card_1: seat_index === 0 ? "14s" : null,
      showdown_card_2: seat_index === 0 ? "13s" : null,
    })),
    actions,
  };
}
