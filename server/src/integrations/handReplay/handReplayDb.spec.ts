/**
 * Tests for hand replayer database functions
 *
 * NOTE: These tests require a DATABASE_URL environment variable and
 * the migrations to be run. They will be skipped if DATABASE_URL is not set.
 */

import {
    createHand,
    addHandPlayer,
    appendAction,
    setActionTags,
    getHandForPlayback,
    getActionTags,
    Street,
    ActionType,
} from "./handReplayDb";

const hasDatabase = !!process.env.DATABASE_URL;

describe("Hand Replayer DB", () => {
    const testUserId = "00000000-0000-0000-0000-000000000001";
    let testHandId: string;
    let heroPlayerId: string;
    let villainPlayerId: string;

    beforeAll(() => {
        if (!hasDatabase) {
            console.warn(
                "Skipping hand replayer DB tests: DATABASE_URL not set"
            );
        }
    });

    describe("createHand", () => {
        it("should create a hand with valid parameters", async () => {
            if (!hasDatabase) return;

            testHandId = await createHand({
                userId: testUserId,
                tableSize: 6,
                maxPlayers: 6,
                smallBlind: 25,
                bigBlind: 50,
                ante: 0,
                currency: "chips",
                buttonSeat: 1,
                boardCards: [],
                meta: { test: true },
            });

            expect(testHandId).toBeDefined();
            expect(typeof testHandId).toBe("string");
        });
    });

    describe("addHandPlayer", () => {
        it("should add players to a hand", async () => {
            if (!hasDatabase || !testHandId) return;

            heroPlayerId = await addHandPlayer({
                handId: testHandId,
                seat: 1,
                playerLabel: "Hero",
                startingStack: 10000,
                holeCards: ["As", "Kh"],
                isHero: true,
            });

            villainPlayerId = await addHandPlayer({
                handId: testHandId,
                seat: 2,
                playerLabel: "Villain",
                startingStack: 9500,
                holeCards: [],
                isHero: false,
            });

            expect(heroPlayerId).toBeDefined();
            expect(villainPlayerId).toBeDefined();
            expect(heroPlayerId).not.toBe(villainPlayerId);
        });

        it("should enforce unique seats per hand", async () => {
            if (!hasDatabase || !testHandId) return;

            await expect(
                addHandPlayer({
                    handId: testHandId,
                    seat: 1, // Duplicate seat
                    playerLabel: "Duplicate",
                    startingStack: 5000,
                })
            ).rejects.toThrow();
        });
    });

    describe("appendAction", () => {
        it("should append actions with monotonic action_index", async () => {
            if (!hasDatabase || !testHandId || !heroPlayerId) return;

            // Add first action
            const action1Id = await appendAction({
                handId: testHandId,
                street: "PREFLOP" as Street,
                type: "POST_SB" as ActionType,
                actorPlayerId: heroPlayerId,
                amount: 25,
            });

            // Add second action
            const action2Id = await appendAction({
                handId: testHandId,
                street: "PREFLOP" as Street,
                type: "POST_BB" as ActionType,
                actorPlayerId: villainPlayerId,
                amount: 50,
            });

            expect(action1Id).toBeDefined();
            expect(action2Id).toBeDefined();
            expect(action1Id).not.toBe(action2Id);

            // Verify ordering in playback
            const playback = await getHandForPlayback(testHandId);
            expect(playback).not.toBeNull();
            if (playback) {
                const actions = playback.actions.filter(
                    (a) => a.id === action1Id || a.id === action2Id
                );
                expect(actions.length).toBe(2);
                expect(actions[0].action_index).toBeLessThan(
                    actions[1].action_index
                );
            }
        });

        it("should handle actions without actor (dealer actions)", async () => {
            if (!hasDatabase || !testHandId) return;

            const actionId = await appendAction({
                handId: testHandId,
                street: "FLOP" as Street,
                type: "DEAL_FLOP" as ActionType,
                // No actorPlayerId for dealer actions
            });

            expect(actionId).toBeDefined();

            const playback = await getHandForPlayback(testHandId);
            expect(playback).not.toBeNull();
            if (playback) {
                const action = playback.actions.find((a) => a.id === actionId);
                expect(action).toBeDefined();
                expect(action?.actor_player_id).toBeNull();
            }
        });
    });

    describe("setActionTags", () => {
        it("should set tags on an action", async () => {
            if (!hasDatabase || !testHandId || !heroPlayerId) return;

            const actionId = await appendAction({
                handId: testHandId,
                street: "PREFLOP" as Street,
                type: "RAISE" as ActionType,
                actorPlayerId: heroPlayerId,
                amount: 150,
                raiseTo: 200,
                decisionMs: 2500,
            });

            await setActionTags(actionId, ["tanked", "all_in"]);

            const playback = await getHandForPlayback(testHandId);
            expect(playback).not.toBeNull();
            if (playback) {
                const action = playback.actions.find((a) => a.id === actionId);
                expect(action).toBeDefined();
                expect(action?.tags.length).toBeGreaterThan(0);
                const tagKeys = action?.tags.map((t) => t.key) || [];
                expect(tagKeys).toContain("tanked");
                expect(tagKeys).toContain("all_in");
            }
        });

        it("should throw error for non-existent tags", async () => {
            if (!hasDatabase || !testHandId || !heroPlayerId) return;

            const actionId = await appendAction({
                handId: testHandId,
                street: "PREFLOP" as Street,
                type: "CALL" as ActionType,
                actorPlayerId: heroPlayerId,
                amount: 50,
            });

            await expect(
                setActionTags(actionId, ["non_existent_tag"])
            ).rejects.toThrow();
        });
    });

    describe("getHandForPlayback", () => {
        it("should return hand with ordered players and actions", async () => {
            if (!hasDatabase || !testHandId) return;

            const playback = await getHandForPlayback(testHandId);

            expect(playback).not.toBeNull();
            if (playback) {
                // Check hand metadata
                expect(playback.hand.id).toBe(testHandId);
                expect(playback.hand.table_size).toBe(6);
                expect(playback.hand.small_blind).toBe(25);
                expect(playback.hand.big_blind).toBe(50);

                // Check players are ordered by seat
                expect(playback.players.length).toBeGreaterThan(0);
                for (let i = 1; i < playback.players.length; i++) {
                    expect(playback.players[i].seat).toBeGreaterThan(
                        playback.players[i - 1].seat
                    );
                }

                // Check actions are ordered by action_index
                expect(playback.actions.length).toBeGreaterThan(0);
                for (let i = 1; i < playback.actions.length; i++) {
                    expect(playback.actions[i].action_index).toBeGreaterThan(
                        playback.actions[i - 1].action_index
                    );
                }

                // Check each action has tags array
                playback.actions.forEach((action) => {
                    expect(Array.isArray(action.tags)).toBe(true);
                });
            }
        });

        it("should return null for non-existent hand", async () => {
            if (!hasDatabase) return;

            const playback = await getHandForPlayback(
                "00000000-0000-0000-0000-000000000999"
            );
            expect(playback).toBeNull();
        });
    });

    describe("getActionTags", () => {
        it("should return available action tags", async () => {
            if (!hasDatabase) return;

            const tags = await getActionTags();

            expect(Array.isArray(tags)).toBe(true);
            expect(tags.length).toBeGreaterThan(0);

            // Check required tags exist
            const tagKeys = tags.map((t) => t.key);
            expect(tagKeys).toContain("tanked");
            expect(tagKeys).toContain("snap");
            expect(tagKeys).toContain("all_in");
            expect(tagKeys).toContain("showed_1");
            expect(tagKeys).toContain("showed_2");

            // Check tag structure
            tags.forEach((tag) => {
                expect(tag.id).toBeDefined();
                expect(tag.key).toBeDefined();
                expect(typeof tag.key).toBe("string");
            });
        });
    });

    describe("Constraints and Ordering", () => {
        it("should maintain strict action ordering across multiple appends", async () => {
            if (!hasDatabase || !testHandId || !heroPlayerId) return;

            // Create a new hand for this test
            const handId = await createHand({
                userId: testUserId,
                tableSize: 2,
                maxPlayers: 2,
                smallBlind: 10,
                bigBlind: 20,
                buttonSeat: 1,
            });

            const playerId = await addHandPlayer({
                handId,
                seat: 1,
                playerLabel: "Test Player",
                startingStack: 1000,
            });

            // Append multiple actions
            const actionIds: string[] = [];
            for (let i = 0; i < 5; i++) {
                const actionId = await appendAction({
                    handId,
                    street: "PREFLOP" as Street,
                    type: "CHECK" as ActionType,
                    actorPlayerId: playerId,
                });
                actionIds.push(actionId);
            }

            // Verify ordering
            const playback = await getHandForPlayback(handId);
            expect(playback).not.toBeNull();
            if (playback) {
                expect(playback.actions.length).toBe(5);
                for (let i = 0; i < playback.actions.length; i++) {
                    expect(playback.actions[i].action_index).toBe(i);
                }
            }
        });
    });
});
