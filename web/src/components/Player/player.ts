import { html, TemplateResult } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { Card } from "@common/interfaces";
import { pokerBoardStore } from "../../stores/index";
import { SUITS, RANKS } from "../utilities";
import { plusIcon } from "../../assets";

@customElement("poker-player")
export class Player extends MobxLitElement {
    static readonly TAG_NAME = "poker-player";
    static get styles() {
        return styles;
    }

    // Player index (0-based)
    @property({ type: Number })
    playerIndex: number = 0;

    /**
     * Check if this card slot is currently in scope
     */
    isCardInScope(cardIndex: 0 | 1): boolean {
        const scope = pokerBoardStore.scope;
        return (
            scope.kind === "player" &&
            scope.playerIndex === this.playerIndex &&
            scope.cardIndex === cardIndex
        );
    }

    /**
     * Handle card placeholder click
     */
    handleCardClick(cardIndex: 0 | 1) {
        pokerBoardStore.setScope({
            kind: "player",
            playerIndex: this.playerIndex,
            cardIndex,
        });
        pokerBoardStore.openPicker();
    }

    /**
     * Render a single card (or placeholder)
     */
    renderCard(card: Card | null, cardIndex: 0 | 1): TemplateResult {
        const isInScope = this.isCardInScope(cardIndex);
        const isEmpty = card === null;

        if (isEmpty) {
            return html`
                <div
                    class="card-placeholder ${isInScope ? "in-scope" : ""}"
                    @click=${() => this.handleCardClick(cardIndex)}
                >
                    <div class="placeholder-content">
                        <span class="placeholder-icon">${plusIcon}</span>
                    </div>
                </div>
            `;
        }

        const suitData = SUITS.find((s) => s.suit === card.suit);
        const rankData = RANKS.find((r) => r.rank === card.rank);

        return html`
            <div
                class="card-display ${isInScope ? "in-scope" : ""}"
                @click=${() => this.handleCardClick(cardIndex)}
            >
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
        const playerCards = pokerBoardStore.players[this.playerIndex] || [
            null,
            null,
        ];

        return html`
            <div class="player-wrapper">
                <div class="player-container">
                    <div class="player-label">
                        Player ${this.playerIndex + 1}
                    </div>
                    <div class="player-cards">
                        ${this.renderCard(playerCards[0], 0)}
                        ${this.renderCard(playerCards[1], 1)}
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [Player.TAG_NAME]: Player;
    }
}
