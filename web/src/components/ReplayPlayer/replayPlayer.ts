import { html, TemplateResult } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { Card } from "@common/interfaces";
import { SUITS, RANKS } from "../utilities";
import { cardBackIcon } from "../../assets";

/**
 * ReplayPlayer - Display a player during hand replay
 *
 * This component displays player information including hole cards
 * and status (folded, active). It accepts cards via props rather
 * than being coupled to a store, making it suitable for replay mode.
 */
@customElement("replay-player")
export class ReplayPlayer extends MobxLitElement {
    static readonly TAG_NAME = "replay-player";
    static get styles() {
        return styles;
    }

    @property({ type: String })
    playerName: string = "Player";

    @property({ type: Number })
    seatIndex: number = 0;

    @property({ type: Array })
    holeCards: [Card | null, Card | null] = [null, null];

    @property({ type: Boolean })
    isFolded: boolean = false;

    @property({ type: Boolean })
    isHero: boolean = false;

    @property({ type: Boolean })
    isWinner: boolean = false;

    @property({ type: Boolean })
    showCards: boolean = false;

    @property({ type: Boolean })
    isActor: boolean = false;

    @property({ type: Boolean })
    isAllIn: boolean = false;

    @property({ type: Number })
    currentBet: number = 0;

    @property({ type: Number })
    stack: number = 0;

    /**
     * Render a single card (or card back)
     */
    renderCard(card: Card | null): TemplateResult {
        // Show card back if cards should be hidden or card is null
        if (!this.showCards || card === null) {
            return html` <div class="card-back">${cardBackIcon}</div> `;
        }

        const suitData = SUITS.find((s) => s.suit === card.suit);
        const rankData = RANKS.find((r) => r.rank === card.rank);

        return html`
            <div class="card-display">
                <div class="card-content">
                    <span class="card-rank"
                        >${rankData?.label || card.rank}</span
                    >
                    <span
                        class="card-suit-icon"
                        style="color: ${suitData?.color || "#000"}"
                    >
                        ${suitData?.icon}
                    </span>
                </div>
            </div>
        `;
    }

    render() {
        const wrapperClasses = [
            "player-wrapper",
            this.isFolded ? "folded" : "",
            this.isWinner ? "winner" : "",
            this.isHero ? "hero" : "",
            this.isActor ? "active-actor" : "",
            this.isAllIn ? "all-in" : "",
        ]
            .filter(Boolean)
            .join(" ");

        return html`
            <div class="${wrapperClasses}">
                <div class="player-container">
                    <div class="player-label">
                        ${this.playerName}
                        ${this.isHero
                            ? html`<span class="hero-badge">★</span>`
                            : null}
                    </div>
                    <div class="player-cards">
                        ${this.renderCard(this.holeCards[0])}
                        ${this.renderCard(this.holeCards[1])}
                    </div>
                    <div class="stack-label">Stack: $${this.stack}</div>
                    ${this.isFolded
                        ? html`<div class="folded-label">Folded</div>`
                        : null}
                    ${this.isAllIn
                        ? html`<div class="all-in-label">All-in</div>`
                        : null}
                    ${this.currentBet > 0
                        ? html`<div class="current-bet">
                              $${this.currentBet}
                          </div>`
                        : null}
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [ReplayPlayer.TAG_NAME]: ReplayPlayer;
    }
}
