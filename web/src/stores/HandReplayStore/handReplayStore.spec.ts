/**
 * Unit tests for HandReplayStore (SI-13)
 */
import { HandReplayStore } from "./handReplayStore";
import { handService } from "../../services";
import type { HandForPlayback } from "@common/interfaces";

jest.mock("../../services", () => ({
    handService: {
        getHand: jest.fn(),
    },
}));

const mockHandForPlayback: HandForPlayback = {
    hand: {
        id: "hand-uuid-1",
        owner_user_id: "user-1",
        table_size: 6,
        button_seat: 0,
        small_blind: 25,
        big_blind: 50,
        ante: 0,
        board_flop_1: "14h",
        board_flop_2: "13h",
        board_flop_3: "12h",
        board_turn: "11h",
        board_river: "10h",
        created_at: Date.now(),
        updated_at: null,
        deleted_at: null,
    },
    players: [
        {
            id: "player-1",
            hand_id: "hand-uuid-1",
            seat_index: 0,
            display_name: "Hero",
            stack_at_start: 10000,
            is_hero: true,
            showdown_card_1: "14h",
            showdown_card_2: "13d",
            created_at: Date.now(),
            updated_at: null,
            deleted_at: null,
        },
        {
            id: "player-2",
            hand_id: "hand-uuid-1",
            seat_index: 1,
            display_name: "Villain",
            stack_at_start: 9500,
            is_hero: false,
            showdown_card_1: "12d",
            showdown_card_2: "12c",
            created_at: Date.now(),
            updated_at: null,
            deleted_at: null,
        },
    ],
    actions: [
        {
            id: "a1",
            hand_id: "hand-uuid-1",
            sequence_index: 0,
            street: "preflop",
            actor_seat: 0,
            action_type: "POST_SB",
            amount: 25,
            raise_to: null,
            decision_ms: null,
            tags: [],
            created_at: Date.now(),
            updated_at: null,
            deleted_at: null,
        },
        {
            id: "a2",
            hand_id: "hand-uuid-1",
            sequence_index: 1,
            street: "preflop",
            actor_seat: 1,
            action_type: "POST_BB",
            amount: 50,
            raise_to: null,
            decision_ms: null,
            tags: [],
            created_at: Date.now(),
            updated_at: null,
            deleted_at: null,
        },
        {
            id: "a3",
            hand_id: "hand-uuid-1",
            sequence_index: 2,
            street: "preflop",
            actor_seat: 0,
            action_type: "FOLD",
            amount: null,
            raise_to: null,
            decision_ms: null,
            tags: [],
            created_at: Date.now(),
            updated_at: null,
            deleted_at: null,
        },
    ],
};

describe("HandReplayStore", () => {
    let store: HandReplayStore;

    beforeEach(() => {
        jest.clearAllMocks();
        store = new HandReplayStore();
    });

    afterEach(() => {
        store.dispose();
    });

    describe("loadHand", () => {
        it("fetches hand from GET /api/hands/:id and sets state", async () => {
            (handService.getHand as jest.Mock).mockResolvedValue(
                mockHandForPlayback
            );

            await store.loadHand("hand-uuid-1");

            expect(handService.getHand).toHaveBeenCalledWith("hand-uuid-1");
            expect(store.hand).toEqual(mockHandForPlayback);
            expect(store.currentActionIndex).toBe(-1);
            expect(store.loadStatus).toBe("success");
            expect(store.loadError).toBeNull();
        });

        it("sets error state when getHand fails", async () => {
            (handService.getHand as jest.Mock).mockRejectedValue(
                new Error("Hand not found")
            );

            await store.loadHand("bad-id");

            expect(store.loadStatus).toBe("error");
            expect(store.loadError).toBe("Hand not found");
            expect(store.hand).toBeNull();
            expect(store.currentActionIndex).toBe(-1);
        });
    });

    describe("stepForward", () => {
        it("increments currentActionIndex", async () => {
            (handService.getHand as jest.Mock).mockResolvedValue(
                mockHandForPlayback
            );
            await store.loadHand("hand-uuid-1");

            store.stepForward();
            expect(store.currentActionIndex).toBe(0);

            store.stepForward();
            expect(store.currentActionIndex).toBe(1);

            store.stepForward();
            expect(store.currentActionIndex).toBe(2);
        });

        it("does not go past last action", async () => {
            (handService.getHand as jest.Mock).mockResolvedValue(
                mockHandForPlayback
            );
            await store.loadHand("hand-uuid-1");
            store.stepForward();
            store.stepForward();
            store.stepForward();
            store.stepForward();
            expect(store.currentActionIndex).toBe(2);
        });
    });

    describe("stepBack", () => {
        it("decrements currentActionIndex", async () => {
            (handService.getHand as jest.Mock).mockResolvedValue(
                mockHandForPlayback
            );
            await store.loadHand("hand-uuid-1");
            store.currentActionIndex = 2;

            store.stepBack();
            expect(store.currentActionIndex).toBe(1);
            store.stepBack();
            expect(store.currentActionIndex).toBe(0);
            store.stepBack();
            expect(store.currentActionIndex).toBe(-1);
        });
    });

    describe("jumpToStreet", () => {
        it("moves currentActionIndex to first action of street", async () => {
            (handService.getHand as jest.Mock).mockResolvedValue(
                mockHandForPlayback
            );
            await store.loadHand("hand-uuid-1");

            store.jumpToStreet("preflop");
            expect(store.currentActionIndex).toBe(0);

            store.jumpToStreet("flop");
            expect(store.currentActionIndex).toBe(-1);
        });
    });

    describe("computed: currentPot", () => {
        it("sums amounts up to current action", async () => {
            (handService.getHand as jest.Mock).mockResolvedValue(
                mockHandForPlayback
            );
            await store.loadHand("hand-uuid-1");
            expect(store.currentPot).toBe(0);

            store.stepForward();
            expect(store.currentPot).toBe(25);
            store.stepForward();
            expect(store.currentPot).toBe(75);
        });
    });

    describe("computed: activePlayers", () => {
        it("excludes folded seats", async () => {
            (handService.getHand as jest.Mock).mockResolvedValue(
                mockHandForPlayback
            );
            await store.loadHand("hand-uuid-1");
            expect(store.activePlayers.size).toBe(2);
            expect(store.activePlayers.has(0)).toBe(true);
            expect(store.activePlayers.has(1)).toBe(true);

            store.stepForward();
            store.stepForward();
            store.stepForward();
            expect(store.activePlayers.has(0)).toBe(false);
            expect(store.activePlayers.has(1)).toBe(true);
        });
    });

    describe("computed: isComplete", () => {
        it("returns true when at last action", async () => {
            (handService.getHand as jest.Mock).mockResolvedValue(
                mockHandForPlayback
            );
            await store.loadHand("hand-uuid-1");
            expect(store.isComplete).toBe(false);
            store.currentActionIndex = 2;
            expect(store.isComplete).toBe(true);
        });
    });

    describe("reset", () => {
        it("pauses and sets currentActionIndex to -1", async () => {
            (handService.getHand as jest.Mock).mockResolvedValue(
                mockHandForPlayback
            );
            await store.loadHand("hand-uuid-1");
            store.stepForward();
            store.reset();
            expect(store.currentActionIndex).toBe(-1);
            expect(store.isPlaying).toBe(false);
        });
    });
});
