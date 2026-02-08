import { describe, it, expect } from "vitest";
import { nextScope, type Scope } from "./scopeNavigation";

function makeParams(
  activePlayers: number[],
  players: Array<[unknown, unknown]>,
  board: Array<unknown>,
) {
  return {
    numPlayers: players.length,
    activePlayers: new Set(activePlayers),
    players,
    board,
  };
}

describe("nextScope", () => {
  it("advances from player card 0 to card 1", () => {
    const params = makeParams(
      [0, 1],
      [
        [null, null],
        [null, null],
      ],
      [null, null, null, null, null],
    );
    const from: Scope = { kind: "player", playerIndex: 0, cardIndex: 0 };
    const result = nextScope(from, params);
    expect(result).toEqual({
      kind: "player",
      playerIndex: 0,
      cardIndex: 1,
    });
  });

  it("advances from player card 1 to next player card 0", () => {
    const params = makeParams(
      [0, 1],
      [
        ["a", "b"],
        [null, null],
      ],
      [null, null, null, null, null],
    );
    const from: Scope = { kind: "player", playerIndex: 0, cardIndex: 1 };
    const result = nextScope(from, params);
    expect(result).toEqual({
      kind: "player",
      playerIndex: 1,
      cardIndex: 0,
    });
  });

  it("skips inactive players", () => {
    const params = makeParams(
      [0, 2],
      [
        ["a", "b"],
        [null, null],
        [null, null],
      ],
      [null, null, null, null, null],
    );
    const from: Scope = { kind: "player", playerIndex: 0, cardIndex: 1 };
    const result = nextScope(from, params);
    expect(result).toEqual({
      kind: "player",
      playerIndex: 2,
      cardIndex: 0,
    });
  });

  it("advances to board when all player slots filled", () => {
    const params = makeParams(
      [0, 1],
      [
        ["a", "b"],
        ["c", "d"],
      ],
      [null, null, null, null, null],
    );
    const from: Scope = { kind: "player", playerIndex: 1, cardIndex: 1 };
    const result = nextScope(from, params);
    expect(result).toEqual({ kind: "board", boardIndex: 0 });
  });

  it("returns original scope when all slots filled", () => {
    const params = makeParams(
      [0, 1],
      [
        ["a", "b"],
        ["c", "d"],
      ],
      ["e", "f", "g", "h", "i"],
    );
    const from: Scope = { kind: "board", boardIndex: 4 };
    const result = nextScope(from, params);
    expect(result).toEqual(from);
  });
});
