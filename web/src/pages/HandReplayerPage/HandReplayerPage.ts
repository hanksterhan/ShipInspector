import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";
import "../../components/HandRecorder";

import { handReplayStore, routerStore } from "../../stores";
import { tableIcon } from "../../assets";
import { Card } from "@common/interfaces";

/**
 * HandReplayerPage - Replay recorded poker hands
 *
 * This page provides an interface for replaying previously recorded
 * poker hands, allowing users to step through actions and analyze play.
 */
@customElement("hand-replayer-page")
export class HandReplayerPage extends MobxLitElement {
    static readonly TAG_NAME = "hand-replayer-page";
    static get styles() {
        return styles;
    }

    connectedCallback() {
        super.connectedCallback();
        // Load hand from URL if navigating directly to /replay/:handId
        const handId = routerStore.replayHandId;
        if (handId && handReplayStore.hand?.hand.id !== handId) {
            handReplayStore.loadHand(handId);
        }
    }

    /**
     * Calculate position for a player around the elliptical table
     */
    getPlayerPosition(
        seatIndex: number,
        tableSize: number
    ): { top: string; left: string; transform: string } {
        const centerX = 50;
        const centerY = 50;
        const ellipseWidth = 45;
        const ellipseHeight = 35;

        // Calculate angle based on seat position (evenly distributed)
        // Start from top (270 degrees) and go clockwise
        const angleOffset = -90; // Start from top
        const angleDeg = angleOffset + (seatIndex / tableSize) * 360;
        const angleRad = (angleDeg * Math.PI) / 180;

        const x = centerX + ellipseWidth * Math.cos(angleRad);
        const y = centerY + ellipseHeight * Math.sin(angleRad);

        return {
            top: `${y}%`,
            left: `${x}%`,
            transform: "translate(-50%, -50%)",
        };
    }

    /**
     * Format the current action for display
     */
    formatCurrentAction(): string {
        const action = handReplayStore.currentAction;
        if (!action) return "Hand start";

        const playerInfo = handReplayStore.playerInfoBySeat;
        const playerName =
            action.actor_seat !== null
                ? playerInfo.get(action.actor_seat)?.name ||
                  `Seat ${action.actor_seat}`
                : "Dealer";

        const actionType = action.action_type.replace(/_/g, " ");
        const amount = action.amount ? ` $${action.amount}` : "";

        return `${playerName}: ${actionType}${amount}`;
    }

    render() {
        const loadStatus = handReplayStore.loadStatus;
        const loadError = handReplayStore.loadError;
        const hand = handReplayStore.hand;
        const handId = routerStore.replayHandId;

        // SI-30: /hand-replayer shows Record a New Hand (HandRecorder); /replay shows replay UI
        if (routerStore.currentRoute === "/hand-replayer") {
            return html`
                <div class="page-wrapper">
                    <div class="page-container">
                        <div class="page-header">
                            <h1>Record a New Hand</h1>
                            <p>
                                Build a hand step-by-step: configure the game,
                                add players, set the board, and record actions.
                            </p>
                        </div>
                        <div class="page-content">
                            <hand-recorder></hand-recorder>
                        </div>
                    </div>
                </div>
            `;
        }

        // Show placeholder if no hand is selected
        if (!handId && loadStatus === "idle") {
            return html`
                <div class="page-wrapper">
                    <div class="page-container">
                        <div class="page-header">
                            <h1>Hand Replayer</h1>
                            <p>Replay and analyze your recorded poker hands.</p>
                        </div>
                        <div class="page-content">
                            <div class="placeholder-content">
                                <p>
                                    Select a hand from your
                                    <a href="/hand-library">library</a> to
                                    replay it here.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Show loading state
        if (loadStatus === "loading") {
            return html`
                <div class="page-wrapper">
                    <div class="page-container">
                        <div class="page-header">
                            <h1>Hand Replayer</h1>
                        </div>
                        <div class="page-content">
                            <div class="loading-content">
                                <sp-progress-circle
                                    indeterminate
                                    aria-label="Loading hand"
                                ></sp-progress-circle>
                                <p>Loading hand...</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Show error state
        if (loadStatus === "error") {
            return html`
                <div class="page-wrapper">
                    <div class="page-container">
                        <div class="page-header">
                            <h1>Hand Replayer</h1>
                        </div>
                        <div class="page-content">
                            <div class="error-content">
                                <p>Error loading hand: ${loadError}</p>
                                <sp-button
                                    @click=${() =>
                                        routerStore.navigate("/hand-library")}
                                >
                                    Back to Library
                                </sp-button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Show replay interface
        if (!hand) {
            return html`
                <div class="page-wrapper">
                    <div class="page-container">
                        <div class="page-content">
                            <div class="placeholder-content">
                                <p>No hand loaded.</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        const { players } = hand;
        const tableSize = hand.hand.table_size;
        const visibleCards = handReplayStore.visibleCards;
        const activePlayers = handReplayStore.activePlayers;
        const currentPot = handReplayStore.currentPot;
        const currentStreet = handReplayStore.currentStreet;
        const isComplete = handReplayStore.isComplete;
        const winnerSeats = handReplayStore.winnerSeats;

        return html`
            <div class="page-wrapper">
                <div class="page-container">
                    <div class="page-header">
                        <h1>Hand Replayer</h1>
                        <div class="hand-info">
                            <span class="pot-display">Pot: $${currentPot}</span>
                            <span class="street-display"
                                >${currentStreet.charAt(0).toUpperCase() +
                                currentStreet.slice(1)}</span
                            >
                        </div>
                    </div>

                    <div class="page-content">
                        <!-- Poker Table -->
                        <div class="table-container">
                            <div class="table-svg-container">
                                <div class="table-svg-background">
                                    ${tableIcon}
                                </div>
                                <div class="table-content-overlay">
                                    <!-- Players -->
                                    ${players.map((player) => {
                                        const pos = this.getPlayerPosition(
                                            player.seat_index,
                                            tableSize
                                        );
                                        const holeCards =
                                            visibleCards.holeCardsBySeat.get(
                                                player.seat_index
                                            ) || [null, null];
                                        const isFolded = !activePlayers.has(
                                            player.seat_index
                                        );
                                        const showCards =
                                            isComplete && !isFolded;
                                        const isWinner = winnerSeats.has(
                                            player.seat_index
                                        );

                                        return html`
                                            <div
                                                class="player-position"
                                                style="top: ${pos.top}; left: ${pos.left}; transform: ${pos.transform};"
                                            >
                                                <replay-player
                                                    .playerName=${player.display_name}
                                                    .seatIndex=${player.seat_index}
                                                    .holeCards=${holeCards as [
                                                        Card | null,
                                                        Card | null,
                                                    ]}
                                                    .isFolded=${isFolded}
                                                    .isHero=${player.is_hero}
                                                    .showCards=${showCards}
                                                    .isWinner=${isWinner}
                                                ></replay-player>
                                            </div>
                                        `;
                                    })}

                                    <!-- Board Cards -->
                                    <div class="board-cards-wrapper">
                                        <replay-board-cards
                                            .boardCards=${visibleCards.board}
                                        ></replay-board-cards>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Current Action Display -->
                        <div class="action-display">
                            <span class="action-text"
                                >${this.formatCurrentAction()}</span
                            >
                        </div>

                        <!-- Replay Controls -->
                        <replay-controls></replay-controls>
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [HandReplayerPage.TAG_NAME]: HandReplayerPage;
    }
}
