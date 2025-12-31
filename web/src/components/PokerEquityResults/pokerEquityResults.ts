import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { pokerBoardStore } from "../../stores/index";
import { reaction } from "mobx";
import { equityClient } from "../../services/equityClient";
import { Card } from "@common/interfaces";

@customElement("poker-equity-results")
export class PokerEquityResults extends MobxLitElement {
    static readonly TAG_NAME = "poker-equity-results";
    static get styles() {
        return styles;
    }

    private reactionDisposer: (() => void) | null = null;

    connectedCallback() {
        super.connectedCallback();

        // Watch for changes to players and board, then calculate equity
        this.reactionDisposer = reaction(
            () => {
                // Track all player cards and board cards
                return {
                    players: pokerBoardStore.players.map((p) => [p[0], p[1]]),
                    board: pokerBoardStore.board,
                };
            },
            async () => {
                // Check if we can calculate equity
                if (!pokerBoardStore.canCalculateEquity()) {
                    pokerBoardStore.setEquityError(null);
                    return;
                }

                // Get valid players (all must have 2 cards)
                const validPlayers: Array<[Card, Card]> = [];
                for (const player of pokerBoardStore.players) {
                    if (player[0] && player[1]) {
                        validPlayers.push([player[0], player[1]]);
                    }
                }

                if (validPlayers.length < 2) {
                    return;
                }

                // Get board cards (filter out nulls)
                const boardCards: Card[] = pokerBoardStore.board.filter(
                    (c): c is Card => c !== null
                );

                // Set loading state
                pokerBoardStore.setEquityLoading();

                try {
                    const signal = pokerBoardStore.getEquityAbortSignal();
                    const response = await equityClient.calculateEquity(
                        validPlayers,
                        boardCards,
                        signal
                    );

                    // Only update if request wasn't aborted
                    if (signal && !signal.aborted) {
                        pokerBoardStore.setEquitySuccess({
                            win: response.equity.win,
                            tie: response.equity.tie,
                            samples: response.equity.samples,
                        });
                    }
                } catch (err) {
                    // Don't set error for aborted requests
                    if (err instanceof Error && err.name === "AbortError") {
                        return;
                    }

                    const errorMessage =
                        err instanceof Error
                            ? err.message
                            : "Failed to calculate equity";
                    pokerBoardStore.setEquityError(errorMessage);
                }
            },
            { fireImmediately: true }
        );
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.reactionDisposer) {
            this.reactionDisposer();
            this.reactionDisposer = null;
        }
    }

    handleRetry() {
        // Trigger recalculation by updating a reactive value
        // The reaction will pick it up
        pokerBoardStore.setEquityLoading();
    }

    render() {
        const equity = pokerBoardStore.equity;
        const players = pokerBoardStore.players;

        // Loading state
        if (equity.status === "loading") {
            return html`
                <div class="equity-results loading">
                    <sp-progress-circle
                        indeterminate
                        size="s"
                        aria-label="Calculating equity"
                    ></sp-progress-circle>
                    <span class="loading-text">Calculating equity...</span>
                </div>
            `;
        }

        // Error state
        if (equity.status === "error") {
            return html`
                <div class="equity-results error">
                    <span class="error-text">Error: ${equity.error}</span>
                    <button class="retry-button" @click=${this.handleRetry}>
                        Retry
                    </button>
                </div>
            `;
        }

        // Check if we have enough players
        const validPlayers = players.filter(
            (p) => p[0] !== null && p[1] !== null
        );
        if (validPlayers.length < 2) {
            return html`
                <div class="equity-results empty">
                    <span class="empty-text"
                        >Select at least 2 player hands to calculate
                        equity</span
                    >
                </div>
            `;
        }

        // Success state
        if (equity.status === "success" && equity.data) {
            const { win, tie } = equity.data;

            return html`
                <div class="equity-results success">
                    <div class="equity-title">Equity Results</div>
                    <div class="equity-players">
                        ${win.map(
                            (winPercent, index) => html`
                                <div class="equity-player">
                                    <div class="player-header">
                                        Player ${index + 1}
                                    </div>
                                    <div class="equity-stats">
                                        <div class="equity-stat win">
                                            <span class="stat-label">Win:</span>
                                            <span class="stat-value"
                                                >${(winPercent * 100).toFixed(
                                                    2
                                                )}%</span
                                            >
                                        </div>
                                        ${tie[index] >= 0.0001
                                            ? html`
                                                  <div class="equity-stat tie">
                                                      <span class="stat-label"
                                                          >Tie:</span
                                                      >
                                                      <span class="stat-value"
                                                          >${(
                                                              tie[index] * 100
                                                          ).toFixed(2)}%</span
                                                      >
                                                  </div>
                                              `
                                            : ""}
                                    </div>
                                </div>
                            `
                        )}
                    </div>
                    ${equity.data.samples > 0
                        ? html`
                              <div class="samples-info">
                                  Samples:
                                  ${equity.data.samples.toLocaleString()}
                              </div>
                          `
                        : ""}
                </div>
            `;
        }

        // Idle state
        return html`
            <div class="equity-results idle">
                <span class="idle-text">Waiting for player hands...</span>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [PokerEquityResults.TAG_NAME]: PokerEquityResults;
    }
}
