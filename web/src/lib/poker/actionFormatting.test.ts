import { describe, it, expect } from "vitest";
import { formatActionDescription } from "./actionFormatting";
import type {
  HandActionRecord,
  HandPlayerRecord,
  ActionType,
  Street,
} from "@common/interfaces";

function action(
  action_type: ActionType,
  actor_seat: number | null,
  amount?: number | null,
  raise_to?: number | null,
): HandActionRecord {
  return {
    id: "test-id",
    hand_id: "test-hand-id",
    sequence_index: 0,
    street: "preflop" as Street,
    actor_seat,
    action_type,
    amount: amount ?? null,
    raise_to: raise_to ?? null,
    decision_ms: null,
    tags: [],
    created_at: Date.now(),
    updated_at: null,
    deleted_at: null,
  };
}

describe("formatActionDescription", () => {
  const players = [
    { seat_index: 0, display_name: "Alice" },
    { seat_index: 1, display_name: "Bob" },
  ] as HandPlayerRecord[];

  describe("blind and ante actions", () => {
    it("formats POST_SB with amount", () => {
      const testAction = action("POST_SB", 0, 50);

      expect(formatActionDescription(testAction, players)).toBe(
        "Alice posts SB $0.50",
      );
    });

    it("formats POST_BB with amount", () => {
      const testAction = action("POST_BB", 1, 100);

      expect(formatActionDescription(testAction, players)).toBe(
        "Bob posts BB $1.00",
      );
    });

    it("formats POST_ANTE with amount", () => {
      const testAction = action("POST_ANTE", 0, 25);

      expect(formatActionDescription(testAction, players)).toBe(
        "Alice posts ante $0.25",
      );
    });

    it("formats STRADDLE with amount", () => {
      const testAction = action("STRADDLE", 0, 200);

      expect(formatActionDescription(testAction, players)).toBe(
        "Alice straddles $2.00",
      );
    });
  });

  describe("basic betting actions", () => {
    it("formats FOLD without amount", () => {
      const testAction = action("FOLD", 0);

      expect(formatActionDescription(testAction, players)).toBe("Alice folds");
    });

    it("formats CHECK", () => {
      const testAction = action("CHECK", 0);

      expect(formatActionDescription(testAction, players)).toBe("Alice checks");
    });

    it("formats CALL with amount", () => {
      const testAction = action("CALL", 1, 100);

      expect(formatActionDescription(testAction, players)).toBe(
        "Bob calls $1.00",
      );
    });

    it("formats BET with amount", () => {
      const testAction = action("BET", 0, 200);

      expect(formatActionDescription(testAction, players)).toBe(
        "Alice bets $2.00",
      );
    });

    it("formats RAISE with raise_to", () => {
      const testAction = action("RAISE", 0, null, 300);

      expect(formatActionDescription(testAction, players)).toBe(
        "Alice raises to $3.00",
      );
    });

    it("formats ALL_IN with amount", () => {
      const testAction = action("ALL_IN", 0, 5000);

      expect(formatActionDescription(testAction, players)).toBe(
        "Alice is all-in $50.00",
      );
    });
  });

  describe("reveal and dealing actions", () => {
    it("formats REVEAL", () => {
      const testAction = action("REVEAL", 0);

      expect(formatActionDescription(testAction, players)).toBe(
        "Alice reveals",
      );
    });

    it("formats DEAL_FLOP with null actor_seat", () => {
      const testAction = action("DEAL_FLOP", null);

      expect(formatActionDescription(testAction, players)).toBe("Deal flop");
    });

    it("formats DEAL_TURN", () => {
      const testAction = action("DEAL_TURN", null);

      expect(formatActionDescription(testAction, players)).toBe("Deal turn");
    });

    it("formats DEAL_RIVER", () => {
      const testAction = action("DEAL_RIVER", null);

      expect(formatActionDescription(testAction, players)).toBe("Deal river");
    });
  });

  describe("pot collection", () => {
    it("formats COLLECT with amount", () => {
      const testAction = action("COLLECT", 0, 1000);

      expect(formatActionDescription(testAction, players)).toBe(
        "Alice wins pot $10.00",
      );
    });
  });

  describe("note action", () => {
    it("formats NOTE", () => {
      const testAction = action("NOTE", 0);

      expect(formatActionDescription(testAction, players)).toBe("Note");
    });
  });

  describe("edge cases and fallbacks", () => {
    it("handles unknown action_type with default format", () => {
      const testAction = {
        id: "test-id",
        hand_id: "test-hand-id",
        sequence_index: 0,
        street: "preflop" as Street,
        actor_seat: 0,
        action_type: "UNKNOWN_ACTION" as ActionType,
        amount: 100,
        raise_to: null,
        decision_ms: null,
        tags: [],
        created_at: Date.now(),
        updated_at: null,
        deleted_at: null,
      };

      expect(formatActionDescription(testAction, players)).toBe(
        "Alice: UNKNOWN_ACTION $1.00",
      );
    });

    it("falls back to 'Seat N' for unknown player seat", () => {
      const testAction = action("FOLD", 5);

      expect(formatActionDescription(testAction, players)).toBe("Seat 5 folds");
    });

    it("uses 'Dealer' for null actor_seat", () => {
      const testAction = {
        id: "test-id",
        hand_id: "test-hand-id",
        sequence_index: 0,
        street: "preflop" as Street,
        actor_seat: null,
        action_type: "UNKNOWN_ACTION" as ActionType,
        amount: null,
        raise_to: null,
        decision_ms: null,
        tags: [],
        created_at: Date.now(),
        updated_at: null,
        deleted_at: null,
      };

      expect(formatActionDescription(testAction, players)).toBe(
        "Dealer: UNKNOWN_ACTION",
      );
    });

    it("handles action with both amount and raise_to (prefers amount)", () => {
      const testAction = action("BET", 0, 200, 300);

      expect(formatActionDescription(testAction, players)).toBe(
        "Alice bets $2.00",
      );
    });

    it("handles action with only raise_to (no amount)", () => {
      const testAction = action("RAISE", 1, null, 500);

      expect(formatActionDescription(testAction, players)).toBe(
        "Bob raises to $5.00",
      );
    });

    it("handles action with neither amount nor raise_to", () => {
      const testAction = {
        id: "test-id",
        hand_id: "test-hand-id",
        sequence_index: 0,
        street: "preflop" as Street,
        actor_seat: 0,
        action_type: "UNKNOWN_ACTION" as ActionType,
        amount: null,
        raise_to: null,
        decision_ms: null,
        tags: [],
        created_at: Date.now(),
        updated_at: null,
        deleted_at: null,
      };

      expect(formatActionDescription(testAction, players)).toBe(
        "Alice: UNKNOWN_ACTION",
      );
    });
  });

  describe("currency formatting", () => {
    it("formats cents correctly to dollars with two decimals", () => {
      const testAction = action("BET", 0, 1);

      expect(formatActionDescription(testAction, players)).toBe(
        "Alice bets $0.01",
      );
    });

    it("formats large amounts correctly", () => {
      const testAction = action("ALL_IN", 0, 123456);

      expect(formatActionDescription(testAction, players)).toBe(
        "Alice is all-in $1234.56",
      );
    });

    it("formats zero amount correctly", () => {
      const testAction = action("BET", 0, 0);

      expect(formatActionDescription(testAction, players)).toBe(
        "Alice bets $0.00",
      );
    });
  });
});
