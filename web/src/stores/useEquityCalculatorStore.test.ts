import { describe, it, expect, beforeEach } from "vitest";
import { useEquityCalculatorStore } from "./useEquityCalculatorStore";
import type { Card } from "@common/interfaces";

function card(rank: number, suit: string): Card {
  return { rank, suit } as Card;
}

describe("useEquityCalculatorStore", () => {
  beforeEach(() => {
    useEquityCalculatorStore.getState().resetAll();
  });

  it("has correct initial state", () => {
    const state = useEquityCalculatorStore.getState();
    expect(state.players).toHaveLength(8);
    expect(state.activePlayers.size).toBe(2);
    expect(state.activePlayers.has(0)).toBe(true);
    expect(state.activePlayers.has(1)).toBe(true);
    expect(state.board.every((c) => c === null)).toBe(true);
    expect(state.scope).toEqual({
      kind: "player",
      playerIndex: 0,
      cardIndex: 0,
    });
    expect(state.pickerOpen).toBe(false);
    expect(state.equity.status).toBe("idle");
  });

  it("setCard applies card and auto-advances scope", () => {
    const store = useEquityCalculatorStore.getState();
    const result = store.setCard(card(14, "h"));
    expect(result).toBe(true);

    const state = useEquityCalculatorStore.getState();
    expect(state.players[0][0]).toEqual(card(14, "h"));
    expect(state.scope).toEqual({
      kind: "player",
      playerIndex: 0,
      cardIndex: 1,
    });
  });

  it("prevents duplicate cards", () => {
    useEquityCalculatorStore.getState().setCard(card(14, "h"));
    const result = useEquityCalculatorStore.getState().setCard(card(14, "h"));
    expect(result).toBe(false);
  });

  it("clearCard removes a player card", () => {
    useEquityCalculatorStore.getState().setCard(card(14, "h"));
    useEquityCalculatorStore
      .getState()
      .clearCard({ kind: "player", playerIndex: 0, cardIndex: 0 });
    expect(
      useEquityCalculatorStore.getState().players[0][0],
    ).toBeNull();
  });

  it("clearCard cascades for board", () => {
    const store = useEquityCalculatorStore.getState();
    // Fill player cards first
    store.setCard(card(14, "h"));
    store.setCard(card(13, "h"));
    store.setCard(card(12, "h"));
    store.setCard(card(11, "h"));
    // Now scope should be at board[0]
    store.setCard(card(10, "d"));
    store.setCard(card(9, "d"));
    store.setCard(card(8, "d"));

    useEquityCalculatorStore
      .getState()
      .clearCard({ kind: "board", boardIndex: 1 });

    const board = useEquityCalculatorStore.getState().board;
    expect(board[0]).not.toBeNull();
    expect(board[1]).toBeNull();
    expect(board[2]).toBeNull();
  });

  it("addPlayer activates a player slot", () => {
    useEquityCalculatorStore.getState().addPlayer(3);
    expect(
      useEquityCalculatorStore.getState().activePlayers.has(3),
    ).toBe(true);
  });

  it("removePlayer deactivates and clears cards", () => {
    useEquityCalculatorStore.getState().addPlayer(3);
    useEquityCalculatorStore
      .getState()
      .applyCardToScope(
        { kind: "player", playerIndex: 3, cardIndex: 0 },
        card(14, "h"),
      );
    useEquityCalculatorStore.getState().removePlayer(3);

    const state = useEquityCalculatorStore.getState();
    expect(state.activePlayers.has(3)).toBe(false);
    expect(state.players[3][0]).toBeNull();
  });

  it("resetAll clears everything", () => {
    useEquityCalculatorStore.getState().setCard(card(14, "h"));
    useEquityCalculatorStore.getState().addPlayer(5);
    useEquityCalculatorStore.getState().resetAll();

    const state = useEquityCalculatorStore.getState();
    expect(state.players.every((p) => p[0] === null && p[1] === null)).toBe(
      true,
    );
    expect(state.activePlayers.size).toBe(2);
    expect(state.equity.status).toBe("idle");
  });

  it("isCardUsed detects used cards", () => {
    useEquityCalculatorStore.getState().setCard(card(14, "h"));
    expect(
      useEquityCalculatorStore.getState().isCardUsed(card(14, "h")),
    ).toBe(true);
    expect(
      useEquityCalculatorStore.getState().isCardUsed(card(14, "d")),
    ).toBe(false);
  });

  it("openPicker and closePicker toggle state", () => {
    useEquityCalculatorStore.getState().openPicker();
    expect(useEquityCalculatorStore.getState().pickerOpen).toBe(true);
    useEquityCalculatorStore.getState().closePicker();
    expect(useEquityCalculatorStore.getState().pickerOpen).toBe(false);
  });

  it("getPlayerCards returns correct cards", () => {
    useEquityCalculatorStore.getState().setCard(card(14, "h"));
    const cards = useEquityCalculatorStore.getState().getPlayerCards(0);
    expect(cards[0]).toEqual(card(14, "h"));
    expect(cards[1]).toBeNull();
  });
});
