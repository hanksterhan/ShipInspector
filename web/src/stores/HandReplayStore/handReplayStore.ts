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
    get playerStateBySeat(): Map<
        number,
        { stack: number; streetBet: number; isAllIn: boolean }
    > {
        const state = new Map<
            number,
            { stack: number; streetBet: number; isAllIn: boolean }
        >();
        if (!this.hand) return state;

        const stackBySeat = new Map<number, number>();
        const streetBetBySeat = new Map<number, number>();
        for (const p of this.hand.players) {
            stackBySeat.set(p.seat_index, p.stack_at_start);
            streetBetBySeat.set(p.seat_index, 0);
        }

        const contributionActions = new Set([
            "POST_SB",
            "POST_BB",
            "POST_ANTE",
            "STRADDLE",
            "CALL",
            "BET",
            "RAISE",
            "ALL_IN",
        ]);

        let currentStreet: Street | null = null;
        const actionsToApply = this.hand.actions.slice(
            0,
            this.currentActionIndex + 1
        );
        for (const action of actionsToApply) {
            if (currentStreet !== action.street) {
                currentStreet = action.street;
                streetBetBySeat.clear();
                for (const p of this.hand.players) {
                    streetBetBySeat.set(p.seat_index, 0);
                }
            }

            if (action.actor_seat == null) continue;
            const seat = action.actor_seat;

            if (action.action_type === "COLLECT") {
                if (action.amount != null) {
                    const existingStack = stackBySeat.get(seat) ?? 0;
                    stackBySeat.set(seat, existingStack + action.amount);
                }
                continue;
            }

            if (!contributionActions.has(action.action_type)) continue;

            const currentStreetBet = streetBetBySeat.get(seat) ?? 0;
            let delta = 0;
            if (action.amount != null) {
                delta = action.amount;
            } else if (action.raise_to != null) {
                delta = Math.max(0, action.raise_to - currentStreetBet);
            }

            if (delta > 0) {
                const existingStack = stackBySeat.get(seat) ?? 0;
                stackBySeat.set(seat, Math.max(0, existingStack - delta));
                streetBetBySeat.set(seat, currentStreetBet + delta);
            }
        }

        for (const p of this.hand.players) {
            const stack = stackBySeat.get(p.seat_index) ?? p.stack_at_start;
            const streetBet = streetBetBySeat.get(p.seat_index) ?? 0;
            state.set(p.seat_index, {
                stack,
                streetBet,
                isAllIn: stack <= 0,
            });
        }

        return state;
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
        const revealedSeats = new Set<number>();

        let flopDealt = false;
        let turnDealt = false;
        let riverDealt = false;

        for (const a of actionsToApply) {
            if (a.action_type === "DEAL_FLOP") flopDealt = true;
            if (a.action_type === "DEAL_TURN") turnDealt = true;
            if (a.action_type === "DEAL_RIVER") riverDealt = true;
            if (a.action_type === "REVEAL" && a.actor_seat != null) {
                revealedSeats.add(a.actor_seat);
            }
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
                (isComplete || revealedSeats.has(seat)) &&
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
    setActionIndex(index: number): void {
        if (!this.hand) return;
        const maxIndex = this.hand.actions.length - 1;
        this.currentActionIndex = Math.max(-1, Math.min(index, maxIndex));
    }

    @computed
    get totalActions(): number {
        return this.hand?.actions.length ?? 0;
    }

    @computed
    get currentAction() {
        if (!this.hand || this.currentActionIndex < 0) return null;
        return this.hand.actions[this.currentActionIndex] ?? null;
    }

    @computed
    get playerInfoBySeat(): Map<
        number,
        { name: string; stack: number; isHero: boolean }
    > {
        const map = new Map<
            number,
            { name: string; stack: number; isHero: boolean }
        >();
        if (!this.hand) return map;
        for (const p of this.hand.players) {
            map.set(p.seat_index, {
                name: p.display_name,
                stack: p.stack_at_start,
                isHero: p.is_hero,
            });
        }
        return map;
    }

    /**
     * Returns the set of seat indices that won the pot (collected chips).
     * Only returns winners when the hand is complete and a COLLECT action is found.
     */
    @computed
    get winnerSeats(): Set<number> {
        const winners = new Set<number>();
        if (!this.hand || !this.isComplete) return winners;

        // Find COLLECT actions to determine winners
        for (const a of this.hand.actions) {
            if (a.action_type === "COLLECT" && a.actor_seat != null) {
                winners.add(a.actor_seat);
            }
        }

        // If no COLLECT action, winner is the last active player (everyone else folded)
        if (winners.size === 0 && this.activePlayers.size === 1) {
            this.activePlayers.forEach((seat) => winners.add(seat));
        }

        return winners;
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
