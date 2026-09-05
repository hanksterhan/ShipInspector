import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TableView } from "@common/interfaces/tableInterfaces";
import { CpuPlayers } from "./CpuPlayers";
const table: TableView = {
  id: "table",
  version: 2,
  settings: {
    name: "Practice",
    maxPlayers: 2,
    smallBlind: 5,
    bigBlind: 10,
    startingStack: 1000,
    turnSeconds: 30,
  },
  isOwner: true,
  yourSeat: null,
  street: "waiting",
  handNumber: 0,
  button: -1,
  actor: null,
  deadline: null,
  serverTime: 0,
  board: [],
  pot: 0,
  currentBet: 0,
  seats: [],
  legal: null,
  awards: [],
  events: [],
  canDeal: false,
  closed: false,
  agents: [],
};
describe("CPU seat controls", () => {
  it("offers a visible retry inside the panel while uncertain state disables new commands", () => {
    const retry = vi.fn();
    const send = vi.fn();
    render(
      <CpuPlayers
        table={table}
        disabled
        busy={false}
        error="The request timed out."
        retry={retry}
        send={send}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The request timed out.",
    );
    expect(screen.getByRole("button", { name: "Add Vega" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Retry same action" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(send).not.toHaveBeenCalled();
  });
  it("locks profile and seat changes during a hand", () => {
    render(
      <CpuPlayers
        table={{ ...table, street: "flop" }}
        disabled={false}
        busy={false}
        send={vi.fn()}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("after this hand");
    for (const radio of screen.getAllByRole("radio"))
      expect(radio).toBeDisabled();
    for (const button of screen.getAllByRole("button"))
      expect(button).toBeDisabled();
  });
  it("keeps selected profile and action label in sync and prevents adding to a full table", () => {
    const send = vi.fn();
    const { rerender } = render(
      <CpuPlayers table={table} disabled={false} busy={false} send={send} />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Marina Passive" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Marina" }));
    expect(send).toHaveBeenCalledWith({
      type: "add-bots",
      styles: ["passive"],
    });
    rerender(
      <CpuPlayers
        table={{
          ...table,
          seats: [0, 1].map((seat) => ({
            seat,
            name: `Player ${seat + 1}`,
            kind: "human" as const,
            stack: 1000,
            bet: 0,
            committed: 0,
            status: "waiting" as const,
            ready: false,
            sittingOut: false,
            isYou: false,
            cards: [],
            hasCards: false,
            lastAction: "Joined",
          })),
        }}
        disabled={false}
        busy={false}
        send={send}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "All seats are taken.",
    );
    expect(screen.getByRole("button", { name: "Add Marina" })).toBeDisabled();
  });
});
