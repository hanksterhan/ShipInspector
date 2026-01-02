import { html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import {
    handReplayClient,
    HandForPlayback,
} from "../../services/handReplayClient";

@customElement("hand-replay")
export class HandReplay extends MobxLitElement {
    static readonly TAG_NAME = "hand-replay";
    static get styles() {
        return css`
            :host {
                display: block;
                padding: 20px;
            }

            .loading {
                text-align: center;
                padding: 40px;
            }

            .error {
                color: #dc3545;
                padding: 20px;
                text-align: center;
            }

            .replay-info {
                margin-bottom: 20px;
                padding: 16px;
                background: #f8f9fa;
                border-radius: 4px;
            }

            .actions-list {
                margin-top: 20px;
            }

            .action-item {
                padding: 8px;
                margin: 4px 0;
                background: white;
                border-left: 3px solid #007bff;
                border-radius: 2px;
            }

            .action-tags {
                display: inline-block;
                margin-left: 8px;
            }

            .tag {
                display: inline-block;
                padding: 2px 6px;
                margin: 0 2px;
                background: #e9ecef;
                border-radius: 2px;
                font-size: 12px;
            }
        `;
    }

    private handId: string | null = null;
    private playback: HandForPlayback | null = null;
    private loading: boolean = false;
    private error: string | null = null;

    connectedCallback() {
        super.connectedCallback();
        this.loadHand();
    }

    async loadHand() {
        // Extract handId from URL
        const path = window.location.pathname;
        const match = path.match(/\/replay\/([^\/]+)/);
        if (!match) {
            this.error = "Invalid hand ID";
            this.requestUpdate();
            return;
        }

        this.handId = match[1];
        this.loading = true;
        this.error = null;
        this.requestUpdate();

        try {
            this.playback = await handReplayClient.getHand(this.handId);
            this.loadIntoPokerBoard();
        } catch (err: any) {
            this.error = err.message || "Failed to load hand";
        } finally {
            this.loading = false;
            this.requestUpdate();
        }
    }

    loadIntoPokerBoard() {
        if (!this.playback) return;

        // TODO: Load players and cards into pokerBoardStore
        // This requires using the scope-based card selection system
        // For now, the replay page just displays the data
        // You can extend this to properly load into PokerBoardStore by:
        // 1. Setting scope for each player/board position
        // 2. Calling pokerBoardStore.setCard() for each card
        // 3. Setting player names via pokerBoardStore.setPlayerName()
    }

    render() {
        if (this.loading) {
            return html`<div class="loading">Loading hand...</div>`;
        }

        if (this.error) {
            return html`<div class="error">Error: ${this.error}</div>`;
        }

        if (!this.playback) {
            return html`<div class="error">Hand not found</div>`;
        }

        const { hand, players, actions } = this.playback;

        return html`
            <div>
                <div class="replay-info">
                    <h2>Hand Replay</h2>
                    <p>Hand ID: ${hand.id}</p>
                    <p>
                        Blinds: ${hand.small_blind}/${hand.big_blind} | Button:
                        Seat ${hand.button_seat} | Table: ${hand.table_size}-max
                    </p>
                    <p>Players: ${players.length}</p>
                </div>

                <div class="actions-list">
                    <h3>Action Timeline</h3>
                    ${actions.map(
                        (action) => html`
                            <div class="action-item">
                                <strong>${action.action_index}.</strong>
                                ${action.street}:
                                ${this.getActionDescription(action)}
                                ${action.tags && action.tags.length > 0
                                    ? html`
                                          <span class="action-tags">
                                              ${action.tags.map(
                                                  (tag) =>
                                                      html`<span class="tag"
                                                          >${tag.key}</span
                                                      >`
                                              )}
                                          </span>
                                      `
                                    : null}
                            </div>
                        `
                    )}
                </div>

                <!-- TODO: Render poker table with loaded data -->
                <!-- For now, data is displayed above. You can extend this to properly load into PokerBoardStore -->
            </div>
        `;
    }

    private getActionDescription(
        action: HandForPlayback["actions"][0]
    ): string {
        const player = this.playback?.players.find(
            (p) => p.id === action.actor_player_id
        );
        const actorName = player ? player.player_label : "Dealer";
        let desc = `${actorName} ${action.type}`;
        if (action.amount) {
            desc += ` ${action.amount}`;
        }
        if (action.raise_to) {
            desc += ` (to ${action.raise_to})`;
        }
        return desc;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [HandReplay.TAG_NAME]: HandReplay;
    }
}
