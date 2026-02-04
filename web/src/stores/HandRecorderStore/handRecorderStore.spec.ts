import { HandRecorderStore } from "./handRecorderStore";
import { handService } from "../../services";
import { get, del } from "idb-keyval";

jest.mock("idb-keyval", () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
}));

jest.mock("../../services", () => ({
    handService: {
        createHand: jest.fn(),
    },
}));

describe("HandRecorderStore", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("sets validation errors and skips submit on invalid data", async () => {
        const store = new HandRecorderStore();

        const result = await store.submitHand();

        expect(result).toBeNull();
        expect(Object.keys(store.validationErrors).length).toBeGreaterThan(0);
        expect(handService.createHand).not.toHaveBeenCalled();
    });

    it("purges stale drafts older than 7 days", async () => {
        const now = Date.now();
        (get as jest.Mock).mockResolvedValue({
            savedAt: now - 8 * 24 * 60 * 60 * 1000,
            draft: {
                gameSettings: {
                    tableSize: 6,
                    buttonSeat: 0,
                    smallBlind: 50,
                    bigBlind: 100,
                    ante: 0,
                    board: [null, null, null, null, null],
                },
                players: [],
                actions: [],
                currentStreet: "preflop",
            },
        });

        const store = new HandRecorderStore();
        await store.loadDraft();

        expect(del).toHaveBeenCalled();
        expect(store.isDraft).toBe(false);
    });
});
