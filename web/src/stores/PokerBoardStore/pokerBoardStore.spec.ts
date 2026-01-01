/**
 * Unit tests for PokerBoardStore
 *
 * To run these tests, add Jest to the project:
 *   npm install --save-dev jest @types/jest ts-jest
 *
 * Then add to package.json:
 *   "scripts": {
 *     "test": "jest"
 *   }
 *
 * And create jest.config.js:
 *   module.exports = {
 *     preset: 'ts-jest',
 *     testEnvironment: 'node',
 *     moduleNameMapper: {
 *       '^@common/(.*)$': '<rootDir>/../common/src/$1'
 *     }
 *   };
 */

import { PokerBoardStore } from "./pokerBoardStore";
import { Card } from "@common/interfaces";

describe("PokerBoardStore", () => {
    let store: PokerBoardStore;

    beforeEach(() => {
        store = new PokerBoardStore();
    });

    describe("Initialization", () => {
        it("should initialize with empty players and board", () => {
            expect(store.players.length).toBe(2);
            expect(store.players[0]).toEqual([null, null]);
            expect(store.players[1]).toEqual([null, null]);
            expect(store.board).toEqual([null, null, null, null, null]);
        });

        it("should initialize scope to Player 1, Card 1", () => {
            expect(store.scope).toEqual({
                kind: "player",
                playerIndex: 0,
                cardIndex: 0,
            });
        });

        it("should initialize with picker closed", () => {
            expect(store.pickerOpen).toBe(false);
        });
    });

    describe("isCardUsed", () => {
        it("should return false for unused card", () => {
            const card: Card = { rank: 14, suit: "h" };
            expect(store.isCardUsed(card)).toBe(false);
        });

        it("should return true for card in player hand", () => {
            const card: Card = { rank: 14, suit: "h" };
            store.players[0][0] = card;
            expect(store.isCardUsed(card)).toBe(true);
        });

        it("should return true for card on board", () => {
            const card: Card = { rank: 14, suit: "h" };
            store.board[0] = card;
            expect(store.isCardUsed(card)).toBe(true);
        });

        it("should return true for card in second player hand", () => {
            const card: Card = { rank: 14, suit: "h" };
            store.players[1][1] = card;
            expect(store.isCardUsed(card)).toBe(true);
        });
    });

    describe("nextScope", () => {
        it("should advance from P1 C1 to P1 C2", () => {
            const scope = {
                kind: "player" as const,
                playerIndex: 0,
                cardIndex: 0 as 0 | 1,
            };
            const next = store.nextScope(scope);
            expect(next).toEqual({
                kind: "player",
                playerIndex: 0,
                cardIndex: 1,
            });
        });

        it("should advance from P1 C2 to P2 C1", () => {
            const scope = {
                kind: "player" as const,
                playerIndex: 0,
                cardIndex: 1 as 0 | 1,
            };
            const next = store.nextScope(scope);
            expect(next).toEqual({
                kind: "player",
                playerIndex: 1,
                cardIndex: 0,
            });
        });

        it("should advance from P2 C2 to Board 0", () => {
            const scope = {
                kind: "player" as const,
                playerIndex: 1,
                cardIndex: 1 as 0 | 1,
            };
            const next = store.nextScope(scope);
            expect(next).toEqual({
                kind: "board",
                boardIndex: 0,
            });
        });

        it("should advance from Board 0 to Board 1", () => {
            const scope = { kind: "board" as const, boardIndex: 0 };
            const next = store.nextScope(scope);
            expect(next).toEqual({
                kind: "board",
                boardIndex: 1,
            });
        });

        it("should advance from Board 4 to stay at Board 4", () => {
            const scope = { kind: "board" as const, boardIndex: 4 };
            const next = store.nextScope(scope);
            expect(next).toEqual({
                kind: "board",
                boardIndex: 4,
            });
        });

        it("should skip filled slots when advancing", () => {
            // Fill P1 C1
            store.players[0][0] = { rank: 14, suit: "h" };
            // Start from P1 C1, should skip to P1 C2
            const scope = {
                kind: "player" as const,
                playerIndex: 0,
                cardIndex: 0 as 0 | 1,
            };
            const next = store.nextScope(scope);
            expect(next).toEqual({
                kind: "player",
                playerIndex: 0,
                cardIndex: 1,
            });
        });

        it("should find next empty slot when all previous are filled", () => {
            // Fill P1 C1, P1 C2, P2 C1
            store.players[0][0] = { rank: 14, suit: "h" };
            store.players[0][1] = { rank: 13, suit: "h" };
            store.players[1][0] = { rank: 12, suit: "h" };
            // Start from P1 C1, should find P2 C2
            const scope = {
                kind: "player" as const,
                playerIndex: 0,
                cardIndex: 0 as 0 | 1,
            };
            const next = store.nextScope(scope);
            expect(next).toEqual({
                kind: "player",
                playerIndex: 1,
                cardIndex: 1,
            });
        });
    });

    describe("applyCardToScope", () => {
        it("should apply card to player slot", () => {
            const card: Card = { rank: 14, suit: "h" };
            const scope = {
                kind: "player" as const,
                playerIndex: 0,
                cardIndex: 0 as 0 | 1,
            };
            const result = store.applyCardToScope(scope, card);
            expect(result).toBe(true);
            expect(store.players[0][0]).toEqual(card);
        });

        it("should apply card to board slot", () => {
            const card: Card = { rank: 14, suit: "h" };
            const scope = { kind: "board" as const, boardIndex: 0 };
            const result = store.applyCardToScope(scope, card);
            expect(result).toBe(true);
            expect(store.board[0]).toEqual(card);
        });

        it("should reject duplicate card", () => {
            const card: Card = { rank: 14, suit: "h" };
            store.players[0][0] = card;
            const scope = {
                kind: "player" as const,
                playerIndex: 1,
                cardIndex: 0 as 0 | 1,
            };
            const result = store.applyCardToScope(scope, card);
            expect(result).toBe(false);
            expect(store.players[1][0]).toBe(null);
        });
    });

    describe("clearBoardFrom", () => {
        it("should clear board from index 0", () => {
            store.board = [
                { rank: 14, suit: "h" },
                { rank: 13, suit: "h" },
                { rank: 12, suit: "h" },
                { rank: 11, suit: "h" },
                { rank: 10, suit: "h" },
            ];
            store.clearBoardFrom(0);
            expect(store.board).toEqual([null, null, null, null, null]);
        });

        it("should clear board from index 3 (Turn)", () => {
            store.board = [
                { rank: 14, suit: "h" },
                { rank: 13, suit: "h" },
                { rank: 12, suit: "h" },
                { rank: 11, suit: "h" },
                { rank: 10, suit: "h" },
            ];
            store.clearBoardFrom(3);
            expect(store.board).toEqual([
                { rank: 14, suit: "h" },
                { rank: 13, suit: "h" },
                { rank: 12, suit: "h" },
                null,
                null,
            ]);
        });

        it("should clear board from index 4 (River)", () => {
            store.board = [
                { rank: 14, suit: "h" },
                { rank: 13, suit: "h" },
                { rank: 12, suit: "h" },
                { rank: 11, suit: "h" },
                { rank: 10, suit: "h" },
            ];
            store.clearBoardFrom(4);
            expect(store.board).toEqual([
                { rank: 14, suit: "h" },
                { rank: 13, suit: "h" },
                { rank: 12, suit: "h" },
                { rank: 11, suit: "h" },
                null,
            ]);
        });
    });

    describe("setCard", () => {
        it("should set card and auto-advance scope", () => {
            const card: Card = { rank: 14, suit: "h" };
            const initialScope = store.scope;
            const result = store.setCard(card);
            expect(result).toBe(true);
            expect(store.players[0][0]).toEqual(card);
            // Should advance to P1 C2
            expect(store.scope).toEqual({
                kind: "player",
                playerIndex: 0,
                cardIndex: 1,
            });
        });

        it("should not set duplicate card", () => {
            const card: Card = { rank: 14, suit: "h" };
            store.players[0][0] = card;
            store.setScope({ kind: "player", playerIndex: 1, cardIndex: 0 });
            const result = store.setCard(card);
            expect(result).toBe(false);
            expect(store.players[1][0]).toBe(null);
        });
    });

    describe("clearCard", () => {
        it("should clear player card", () => {
            const card: Card = { rank: 14, suit: "h" };
            store.players[0][0] = card;
            store.clearCard({ kind: "player", playerIndex: 0, cardIndex: 0 });
            expect(store.players[0][0]).toBe(null);
        });

        it("should clear board card and cascade", () => {
            store.board = [
                { rank: 14, suit: "h" },
                { rank: 13, suit: "h" },
                { rank: 12, suit: "h" },
                { rank: 11, suit: "h" },
                { rank: 10, suit: "h" },
            ];
            // Clear Turn (index 3), should also clear River
            store.clearCard({ kind: "board", boardIndex: 3 });
            expect(store.board[3]).toBe(null);
            expect(store.board[4]).toBe(null);
        });
    });

    describe("resetAll", () => {
        it("should reset all state", () => {
            store.players[0][0] = { rank: 14, suit: "h" };
            store.players[0][1] = { rank: 13, suit: "h" };
            store.board[0] = { rank: 12, suit: "h" };
            store.setScope({ kind: "board", boardIndex: 1 });
            store.openPicker();
            store.setEquitySuccess({
                win: [0.5, 0.5],
                tie: [0, 0],
                samples: 1000,
            });

            store.resetAll();

            expect(store.players[0]).toEqual([null, null]);
            expect(store.players[1]).toEqual([null, null]);
            expect(store.board).toEqual([null, null, null, null, null]);
            expect(store.scope).toEqual({
                kind: "player",
                playerIndex: 0,
                cardIndex: 0,
            });
            expect(store.pickerOpen).toBe(false);
            expect(store.equity.status).toBe("idle");
        });
    });

    describe("canCalculateEquity", () => {
        it("should return false if any player missing cards", () => {
            store.players[0][0] = { rank: 14, suit: "h" };
            expect(store.canCalculateEquity()).toBe(false);
        });

        it("should return true if all players have 2 cards", () => {
            store.players[0][0] = { rank: 14, suit: "h" };
            store.players[0][1] = { rank: 13, suit: "h" };
            store.players[1][0] = { rank: 12, suit: "h" };
            store.players[1][1] = { rank: 11, suit: "h" };
            expect(store.canCalculateEquity()).toBe(true);
        });
    });
});
