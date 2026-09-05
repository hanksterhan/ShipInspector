import { describe, expect, it } from "vitest";
import { parseScenario, STUDY_EXAMPLES } from "./scenario";

describe("portable study scenarios", () => {
  it.each(STUDY_EXAMPLES)(
    "round-trips $label without losing cards or seat IDs",
    ({ scenario }) => {
      expect(parseScenario(JSON.parse(JSON.stringify(scenario)))).toEqual(
        scenario,
      );
      expect(
        scenario.players.every((p) =>
          p.cards.every((c) => c && Number.isFinite(c.rank)),
        ),
      ).toBe(true);
    },
  );
  it("rejects a duplicate card across board and players", () => {
    const value = structuredClone(STUDY_EXAMPLES[2].scenario);
    value.board[0] = value.players[0].cards[0];
    expect(() => parseScenario(value)).toThrow("only once");
  });
  it("rejects duplicate seats, partial flops, and unsupported formats", () => {
    const value = structuredClone(STUDY_EXAMPLES[2].scenario);
    value.players[1].seat = value.players[0].seat;
    expect(() => parseScenario(value)).toThrow("unique seat");
    expect(() =>
      parseScenario({
        ...STUDY_EXAMPLES[2].scenario,
        board: [null, null, null, null, { rank: 2, suit: "h" }],
      }),
    ).toThrow("complete flop");
    expect(() => parseScenario({ version: 2 })).toThrow("version 1");
  });
});
