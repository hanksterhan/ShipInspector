import { gameDefinition, type GameMode } from "@common/pokerModes";
import { parseCard } from "@common/interfaces";
import { nextBoardDeal, terminalBoard } from "@lib/poker/rules";

const board = (rivers: string) => `2c 3d 4h 5s ${rivers}`.trim().split(" ").map(parseCard);
describe("built-in poker rules", () => {
  it.each([
    ["holdem", "6h", 20, "river-complete"],
    ["red-river-holdem", "6s", 20, "black-river"],
    ["red-river-holdem", "6h", 20, null],
    ["red-river-holdem", "6h 7d", 2, null],
    ["red-river-holdem", "6h 7d 8c", 0, "black-river"],
    ["red-river-holdem", "6h 7d", 0, "deck-exhausted"],
    ["red-river-holdem", "6h 7d", 1, "deck-exhausted"],
  ])("ends %s with %s only under its declared rule", (mode, rivers, remaining, reason) => {
    expect(terminalBoard(gameDefinition(mode as GameMode), board(rivers as string), remaining as number)).toBe(reason);
  });
  it("does not end a hand before its first river and deals a complete flop", () => {
    expect(terminalBoard(gameDefinition("red-river-holdem"), board("").slice(0, 4), 0)).toBeNull();
    expect(nextBoardDeal(0)).toBe(3);
    expect(nextBoardDeal(7)).toBe(1);
    expect(() => nextBoardDeal(2)).toThrow("Invalid board");
  });
  it("rejects unknown modes and rules instead of using Hold'em", () => {
    expect(() => gameDefinition("omaha" as GameMode)).toThrow("Unsupported poker mode");
    expect(() => gameDefinition("red-river-holdem", 2)).toThrow("Unsupported poker rules version");
  });
});
