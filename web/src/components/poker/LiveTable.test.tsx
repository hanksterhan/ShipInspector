import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { TableView } from "@common/interfaces/tableInterfaces";
import { LiveTable } from "./LiveTable";

const dealt = (handNumber = 1): TableView => ({
  id: "table",
  version: handNumber,
  isOwner: true,
  yourSeat: 0,
  street: "preflop",
  handNumber,
  button: 0,
  smallBlindSeat: 1,
  bigBlindSeat: 2,
  actor: 0,
  deadline: null,
  serverTime: 0,
  board: [],
  pot: 15,
  currentBet: 10,
  legal: null,
  awards: [],
  events: [],
  canDeal: false,
  closed: false,
  agents: [],
  settings: {
    name: "Practice",
    maxPlayers: 8,
    smallBlind: 5,
    bigBlind: 10,
    startingStack: 1000,
    turnSeconds: 60,
  },
  seats: Array.from({ length: 8 }, (_, seat) => ({
    seat,
    name: seat === 0 ? "Human" : `CPU ${seat}`,
    kind: seat === 0 ? "human" : "cpu",
    stack: 1000,
    bet: 0,
    committed: 0,
    status: "active",
    ready: true,
    sittingOut: false,
    isYou: seat === 0,
    hasCards: true,
    lastAction: "",
    cards:
      seat === 0
        ? [
            { rank: 14, suit: "s" },
            { rank: 13, suit: "s" },
          ]
        : [],
  })),
});
const waiting = (): TableView => ({
  ...dealt(0),
  street: "waiting",
  seats: dealt().seats.map((s) => ({
    ...s,
    hasCards: false,
    cards: [],
    status: "waiting",
  })),
});
let flights: {
  seat: number;
  card: number;
  timing: KeyframeAnimationOptions;
  cancel: ReturnType<typeof vi.fn>;
}[];
beforeEach(() => {
  flights = [];
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  Object.defineProperty(HTMLElement.prototype, "animate", {
    configurable: true,
    value: vi.fn(function (
      this: HTMLElement,
      _frames: Keyframe[],
      timing: KeyframeAnimationOptions,
    ) {
      const cancel = vi.fn();
      flights.push({
        seat: Number(this.dataset.seat),
        card: Number(this.dataset.card),
        timing,
        cancel,
      });
      return { cancel };
    }),
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, "animate");
  delete document.documentElement.dataset.inputMethod;
});

it("deals two clockwise rounds to all seats without exposing CPU cards", () => {
  const { rerender } = render(<LiveTable table={waiting()} />);
  rerender(<LiveTable table={dealt()} />);
  expect(flights.map((f) => [f.seat, f.card])).toEqual(
    [0, 1].flatMap((card) =>
      [1, 2, 3, 4, 5, 6, 7, 0].map((seat) => [seat, card]),
    ),
  );
  expect(
    Math.max(
      ...flights.map((f) => Number(f.timing.delay) + Number(f.timing.duration)),
    ),
  ).toBeLessThan(1000);
  expect(screen.getAllByRole("img", { name: /hidden card/ })).toHaveLength(14);
  expect(
    screen.getByRole("img", { name: "Human card 1: A of Spades" }),
  ).toBeVisible();
});

it("shows cumulative street bets apart from stacks and resets the displayed phase", () => {
  const t = dealt();
  t.seats[0] = {
    ...t.seats[0],
    bet: 80,
    stack: 920,
    committed: 180,
    lastAction: "Call 20",
  };
  const { rerender } = render(<LiveTable table={t} />);
  expect(
    screen.getByRole("group", { name: "Human: Preflop bet 80 chips" }),
  ).toHaveTextContent("80");
  const seat = screen.getByText("Human").closest(".live-seat")!;
  expect(
    within(seat as HTMLElement).getByText("Stack").parentElement,
  ).toHaveTextContent("920");
  for (const street of ["flop", "turn", "river"] as const) {
    rerender(
      <LiveTable
        table={{
          ...t,
          street,
          seats: t.seats.map((s) => ({ ...s, bet: 0, lastAction: "" })),
        }}
      />,
    );
    expect(
      screen.getByRole("group", {
        name: `Human: ${street[0].toUpperCase() + street.slice(1)} bet 0 chips`,
      }),
    ).toHaveTextContent("0");
    expect(
      screen.queryByRole("group", { name: "Human: Preflop bet 80 chips" }),
    ).not.toBeInTheDocument();
  }
  rerender(<LiveTable table={{ ...t, street: "complete" }} />);
  expect(
    screen.queryByRole("group", { name: /bet .* chips/ }),
  ).not.toBeInTheDocument();
});

it("keeps blind markers after actions and folds, with both dealer and small blind heads-up", () => {
  const t = dealt();
  t.smallBlindSeat = 0;
  t.bigBlindSeat = 1;
  t.seats = t.seats.slice(0, 2);
  const { rerender } = render(<LiveTable table={t} />);
  const human = screen.getByText("Human").closest(".live-seat")! as HTMLElement;
  expect(within(human).getByText("Dealer")).toBeVisible();
  expect(within(human).getByText("Small blind")).toBeVisible();
  expect(screen.getByText("Big blind")).toBeVisible();
  rerender(
    <LiveTable
      table={{
        ...t,
        street: "flop",
        seats: t.seats.map((s) => ({
          ...s,
          status: "folded",
          lastAction: "Fold",
          bet: 40,
        })),
      }}
    />,
  );
  expect(screen.getByText("Small blind")).toBeVisible();
  expect(screen.getByText("Big blind")).toBeVisible();
  expect(
    screen.getByRole("group", { name: "Human: Flop bet 40 chips" }),
  ).toBeVisible();
  rerender(<LiveTable table={waiting()} />);
  expect(screen.queryByText("Dealer")).not.toBeInTheDocument();
  expect(screen.queryByText("Small blind")).not.toBeInTheDocument();
  expect(screen.queryByText("Big blind")).not.toBeInTheDocument();
});

it("does not replay a deal on a poll, a reveal, or initial reconnect", () => {
  const { rerender, unmount } = render(<LiveTable table={dealt()} />);
  expect(flights).toHaveLength(0);
  rerender(<LiveTable table={dealt(2)} />);
  expect(flights).toHaveLength(16);
  rerender(<LiveTable table={{ ...dealt(2), version: 10 }} />);
  expect(flights).toHaveLength(16);
  expect(flights.every((f) => f.cancel.mock.calls.length === 0)).toBe(true);
  rerender(
    <LiveTable
      table={{
        ...dealt(2),
        street: "complete",
        seats: dealt(2).seats.map((s) => ({
          ...s,
          cards: [
            { rank: 2, suit: "h" },
            { rank: 3, suit: "h" },
          ],
        })),
      }}
    />,
  );
  expect(flights).toHaveLength(16);
  expect(flights.every((f) => f.cancel.mock.calls.length === 1)).toBe(true);
  rerender(<LiveTable table={dealt(3)} />);
  expect(flights).toHaveLength(32);
  unmount();
  expect(flights.every((f) => f.cancel.mock.calls.length === 1)).toBe(true);
});

it.each(["reduced motion", "keyboard"])("keeps cards still for %s", (mode) => {
  if (mode === "keyboard")
    document.documentElement.dataset.inputMethod = "keyboard";
  else
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
    } as MediaQueryList);
  const { rerender } = render(<LiveTable table={waiting()} />);
  rerender(<LiveTable table={dealt()} />);
  expect(flights).toHaveLength(0);
  expect(
    screen.getByRole("img", { name: "Human card 1: A of Spades" }),
  ).toBeVisible();
});
