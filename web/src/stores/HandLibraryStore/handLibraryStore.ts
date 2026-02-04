import { action, makeObservable, observable } from "mobx";
import { handService } from "../../services";
import type { HandListItem } from "../../services/handService";

export interface HandLibraryFilters {
    minStakes?: number;
    maxStakes?: number;
    startDate?: number;
    endDate?: number;
}

const DEFAULT_PAGE_SIZE = 20;

export class HandLibraryStore {
    @observable
    hands: HandListItem[] = [];

    @observable
    nextCursor: string | null = null;

    @observable
    isLoading = false;

    @observable
    error: string | null = null;

    @observable
    filters: HandLibraryFilters = {};

    @observable
    selectedHandId: string | null = null;

    constructor() {
        makeObservable(this);
    }

    @action
    setSelectedHandId(handId: string | null) {
        this.selectedHandId = handId;
    }

    @action
    setFilters(filters: HandLibraryFilters) {
        this.filters = { ...filters };
        void this.fetchHands();
    }

    @action
    async fetchHands() {
        if (this.isLoading) {
            return;
        }

        this.isLoading = true;
        this.error = null;

        try {
            const response = await handService.listHands({
                limit: DEFAULT_PAGE_SIZE,
                ...this.filters,
            });
            this.hands = response.hands;
            this.nextCursor = response.nextCursor;
        } catch (error) {
            this.error = this.getErrorMessage(error);
        } finally {
            this.isLoading = false;
        }
    }

    @action
    async loadMore() {
        if (this.isLoading || !this.nextCursor) {
            return;
        }

        this.isLoading = true;
        this.error = null;

        const previousHands = this.hands;
        const previousCursor = this.nextCursor;

        try {
            const response = await handService.listHands({
                limit: DEFAULT_PAGE_SIZE,
                cursor: this.nextCursor,
                ...this.filters,
            });
            this.hands = [...previousHands, ...response.hands];
            this.nextCursor = response.nextCursor;
        } catch (error) {
            this.hands = previousHands;
            this.nextCursor = previousCursor;
            this.error = this.getErrorMessage(error);
        } finally {
            this.isLoading = false;
        }
    }

    @action
    refreshList() {
        void this.fetchHands();
    }

    @action
    async deleteHand(handId: string) {
        const previousHands = this.hands;
        const nextHands = previousHands.filter((hand) => hand.id !== handId);

        if (nextHands.length === previousHands.length) {
            return;
        }

        this.hands = nextHands;
        this.error = null;

        if (this.selectedHandId === handId) {
            this.selectedHandId = null;
        }

        try {
            await handService.deleteHand(handId);
        } catch (error) {
            this.hands = previousHands;
            this.error = this.getErrorMessage(error);
        }
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error && error.message) {
            return error.message;
        }
        return "Request failed";
    }
}
