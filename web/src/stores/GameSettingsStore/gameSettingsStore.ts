import { action, makeObservable, observable } from "mobx";

/**
 * GameSettingsStore manages game-wide settings that are shared across components
 * - Blind amounts (small blind, big blind)
 * - Default stack size
 * - Per-player stack sizes (for display on poker board)
 * When a hand is active, it reads current_stack from HandBuilderStore
 */
export class GameSettingsStore {
    // Lazy getter for handBuilderStore to avoid circular dependency
    private get handBuilderStore() {
        // Import lazily to avoid circular dependency
        const { handBuilderStore } = require("../index");
        return handBuilderStore;
    }
    @observable
    smallBlind: number = 10;

    @observable
    bigBlind: number = 20;

    @observable
    defaultStack: number = 2000;

    @observable
    playerStacks: Map<number, number> = new Map(); // Player stack sizes (0-based player index)

    constructor() {
        makeObservable(this);
    }

    /**
     * Set the small blind amount
     */
    @action
    setSmallBlind(value: number) {
        this.smallBlind = value;
    }

    /**
     * Set the big blind amount
     */
    @action
    setBigBlind(value: number) {
        this.bigBlind = value;
    }

    /**
     * Set the default stack amount
     */
    @action
    setDefaultStack(value: number) {
        this.defaultStack = value;
    }

    /**
     * Get player stack size
     * If a hand is active, reads current_stack from HandBuilderStore
     * Otherwise, returns custom stack if set, or default stack
     * Note: This method accesses handBuilderStore lazily to avoid circular dependency
     */
    getPlayerStack(playerIndex: number): number {
        // If hand is active, get current_stack from HandBuilderStore
        try {
            const store = this.handBuilderStore;
            if (store?.handStarted) {
                // Map playerIndex (0-based) to seat (1-based): seat = playerIndex + 1
                const seat = playerIndex + 1;
                const player = store.players.get(seat);
                if (player) {
                    // Access current_stack to ensure MobX tracks it
                    return player.current_stack;
                }
            }
        } catch (e) {
            // If handBuilderStore not available yet, fall through to default
        }

        // Before hand starts or if player not in hand, use stored stack or default
        const customStack = this.playerStacks.get(playerIndex);
        return customStack !== undefined ? customStack : this.defaultStack;
    }

    /**
     * Set player stack size
     */
    @action
    setPlayerStack(playerIndex: number, stack: number | null) {
        if (stack === null) {
            // Remove custom stack to use default
            this.playerStacks.delete(playerIndex);
        } else {
            this.playerStacks.set(playerIndex, stack);
        }
        // Trigger observable update by creating new Map
        this.playerStacks = new Map(this.playerStacks);
    }

    /**
     * Reset all player stacks to use default
     */
    @action
    resetPlayerStacks() {
        this.playerStacks = new Map();
    }

    /**
     * Reset all settings to defaults
     */
    @action
    reset() {
        this.smallBlind = 10;
        this.bigBlind = 20;
        this.defaultStack = 2000;
        this.playerStacks = new Map();
    }
}
