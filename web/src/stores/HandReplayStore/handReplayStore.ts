import { action, computed, makeObservable, observable } from "mobx";
import { Card, HandForPlayback, Street } from "@common/interfaces";
import { parseCard } from "@common/interfaces";
import { handService } from "../../services";

const DEFAULT_PLAYBACK_SPEED_MS = 800;

export interface VisibleCardsState {
    board: Card[];
    holeCardsBySeat: Map<number, [Card | null, Card | null]>;
}

export class HandReplayStore {
    @observable
    hand: HandForPlayback | null = null;

    @observable
    currentActionIndex: number = -1;

    @observable
    isPlaying: boolean = false;

    @observable
    playbackSpeed: number = DEFAULT_PLAYBACK_SPEED_MS;

    @observable
    loadStatus: "idle" | "loading" | "success" | "error" = "idle";

    @observable
    loadError: string | null = null;

    private playTimerId: number | null = null;

    constructor() {
        makeObservable(this);
    }

    @computed
    get currentStreet(): Street {
        if (!this.hand || this.hand.actions.length === 0) {
            return "preflop";
        }
        const idx = Math.min(
            this.currentActionIndex,
            this.hand.actions.length - 1
        );
        if (idx < 0) {
            return "preflop";
        }
        return this.hand.actions[idx].street;
    }

    @computed
    get visibleCards(): VisibleCardsState {
        const board: Card[] = [];
        const holeCardsBySeat = new Map<number, [Card | null, Card | null]>();

        if (!this.hand) {
            return { board, holeCardsBySeat };
        }

        const { hand: handRecord, players, actions } = this.hand;
        const actionsToApply = actions.slice(0, this.currentActionIndex + 1);

        let flopDealt = false;
        let turnDealt = false;
        let riverDealt = false;

        for (const a of actionsToApply) {
            if (a.action_type === "DEAL_FLOP") flopDealt = true;
            if (a.action_type === "DEAL_TURN") turnDealt = true;
            if (a.action_type === "DEAL_RIVER") riverDealt = true;
        }

        if (
            flopDealt &&
            handRecord.board_flop_1 &&
            handRecord.board_flop_2 &&
            handRecord.board_flop_3
        ) {
            board.push(
                parseCard(handRecord.board_flop_1),
                parseCard(handRecord.board_flop_2),
                parseCard(handRecord.board_flop_3)
            );
        }
        if (turnDealt && handRecord.board_turn) {
            board.push(parseCard(handRecord.board_turn));
        }
        if (riverDealt && handRecord.board_river) {
            board.push(parseCard(handRecord.board_river));
        }

        const isComplete = this.isComplete;
        for (const p of players) {
            const seat = p.seat_index;
            if (
                isComplete &&
                p.showdown_card_1 != null &&
                p.showdown_card_2 != null
            ) {
                holeCardsBySeat.set(seat, [
                    parseCard(p.showdown_card_1),
                    parseCard(p.showdown_card_2),
                ]);
            } else {
                holeCardsBySeat.set(seat, [null, null]);
            }
        }

        return { board, holeCardsBySeat };
    }

    @computed
    get currentPot(): number {
        if (!this.hand) return 0;
        let pot = 0;
        const actionsToApply = this.hand.actions.slice(
            0,
            this.currentActionIndex + 1
        );
        for (const a of actionsToApply) {
            if (a.amount != null && a.amount > 0) {
                pot += a.amount;
            }
        }
        return pot;
    }

    @computed
    get activePlayers(): Set<number> {
        if (!this.hand) return new Set();
        const folded = new Set<number>();
        const actionsToApply = this.hand.actions.slice(
            0,
            this.currentActionIndex + 1
        );
        for (const a of actionsToApply) {
            if (a.action_type === "FOLD" && a.actor_seat != null) {
                folded.add(a.actor_seat);
            }
        }
        const seats = new Set(this.hand.players.map((p) => p.seat_index));
        for (const seat of folded) {
            seats.delete(seat);
        }
        return seats;
    }

    @computed
    get isComplete(): boolean {
        if (!this.hand || this.hand.actions.length === 0) return false;
        return this.currentActionIndex >= this.hand.actions.length - 1;
    }

    @action
    async loadHand(id: string): Promise<void> {
        this.loadStatus = "loading";
        this.loadError = null;
        this.pause();

        try {
            const data = await handService.getHand(id);
            this.hand = data;
            this.currentActionIndex = -1;
            this.loadStatus = "success";
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to load hand";
            this.loadError = message;
            this.loadStatus = "error";
            this.hand = null;
            this.currentActionIndex = -1;
        }
    }

    @action
    stepForward(): void {
        if (!this.hand || this.hand.actions.length === 0) return;
        if (this.currentActionIndex < this.hand.actions.length - 1) {
            this.currentActionIndex += 1;
        }
    }

    @action
    stepBack(): void {
        if (this.currentActionIndex >= 0) {
            this.currentActionIndex -= 1;
        }
    }

    @action
    jumpToStreet(street: Street): void {
        if (!this.hand) return;
        const actions = this.hand.actions;
        const idx = actions.findIndex((a) => a.street === street);
        if (idx >= 0) {
            this.currentActionIndex = idx;
        } else {
            this.currentActionIndex = -1;
        }
    }

    @action
    play(): void {
        if (!this.hand || this.hand.actions.length === 0 || this.isComplete) {
            return;
        }
        if (this.playTimerId != null) return;
        this.isPlaying = true;
        this.playTimerId = window.setInterval(() => {
            if (!this.hand || this.isComplete) {
                this.pause();
                return;
            }
            this.stepForward();
        }, this.playbackSpeed);
    }

    @action
    pause(): void {
        this.isPlaying = false;
        if (this.playTimerId != null) {
            clearInterval(this.playTimerId);
            this.playTimerId = null;
        }
    }

    @action
    reset(): void {
        this.pause();
        this.currentActionIndex = -1;
    }

    @action
    setPlaybackSpeed(ms: number): void {
        this.playbackSpeed = Math.max(100, ms);
        if (this.isPlaying && this.playTimerId != null) {
            this.pause();
            this.play();
        }
    }

    dispose(): void {
        this.pause();
    }
}
