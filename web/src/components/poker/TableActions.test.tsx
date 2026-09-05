import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { TableView } from "@common/interfaces/tableInterfaces";
import { TableActions } from "./TableActions";
it("requires a seated host to mark ready before offering to deal with CPUs", () => {
  const t: TableView = {
    id: "table",
    version: 1,
    isOwner: true,
    yourSeat: 0,
    street: "waiting",
    handNumber: 0,
    button: -1,
    actor: null,
    deadline: null,
    serverTime: 0,
    settings: {
      name: "Practice",
      maxPlayers: 4,
      smallBlind: 5,
      bigBlind: 10,
      startingStack: 1000,
      turnSeconds: 30,
    },
    board: [],
    pot: 0,
    currentBet: 0,
    legal: null,
    awards: [],
    events: [],
    canDeal: true,
    closed: false,
    agents: [],
    seats: [0, 1, 2].map((seat) => ({
      seat,
      name: `Player ${seat}`,
      kind: seat === 0 ? "human" : "cpu",
      stack: 1000,
      bet: 0,
      committed: 0,
      status: "waiting",
      ready: seat !== 0,
      sittingOut: false,
      isYou: seat === 0,
      cards: [],
      hasCards: false,
      lastAction: "Joined",
    })),
  };
  const { rerender } = render(
    <TableActions table={t} disabled={false} send={vi.fn()} />,
  );
  expect(screen.getByRole("button", { name: "I’m ready" })).toBeEnabled();
  expect(
    screen.queryByRole("button", { name: "Deal hand" }),
  ).not.toBeInTheDocument();
  rerender(
    <TableActions
      table={{ ...t, seats: t.seats.map((s) => ({ ...s, ready: true })) }}
      disabled={false}
      send={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: "Deal hand" })).toBeEnabled();
});
