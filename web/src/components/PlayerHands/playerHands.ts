import { html, TemplateResult } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { Card } from "@common/interfaces";
import { pokerBoardStore } from "../../stores/index";
import { SUITS, RANKS } from "../utilities";
import { plusIcon } from "../../assets";

@customElement("player-hands")
export class PlayerHands extends MobxLitElement {
    static readonly TAG_NAME = "player-hands";
    static get styles() {
        return styles;
    }

    handleSlotClick(playerIndex: number, cardIndex: 0 | 1) {
        // Set scope to this player slot
        pokerBoardStore.setScope({
            kind: "player",
            playerIndex,
            cardIndex,
        });
        // Open picker
        pokerBoardStore.openPicker();
    }

    handleClearCard(playerIndex: number, cardIndex: 0 | 1) {
        pokerBoardStore.clearCard({
            kind: "player",
            playerIndex,
            cardIndex,
        });
    }

    isInScope(playerIndex: number, cardIndex: 0 | 1): boolean {
        return (
            pokerBoardStore.scope.kind === "player" &&
            pokerBoardStore.scope.playerIndex === playerIndex &&
            pokerBoardStore.scope.cardIndex === cardIndex
        );
    }

    renderCard(
        card: Card | null,
        playerIndex: number,
        cardIndex: 0 | 1
    ): TemplateResult {
        const isInScope = this.isInScope(playerIndex, cardIndex);

        if (!card) {
            return html`
                <div
                    class="hole-slot ${isInScope ? "in-scope" : ""}"
                    @click=${() => this.handleSlotClick(playerIndex, cardIndex)}
                >
                    <div class="card-back"></div>
                    <div class="plus-overlay">${plusIcon}</div>
                </div>
            `;
        }

        const suitData = SUITS.find((s) => s.suit === card.suit);
        const rankData = RANKS.find((r) => r.rank === card.rank);

        return html`
            <div class="hole-slot ${isInScope ? "in-scope" : ""}">
                <button
                    class="clear-button"
                    @click=${(e: Event) => {
                        e.stopPropagation();
                        this.handleClearCard(playerIndex, cardIndex);
                    }}
                    title="Clear card"
                    aria-label="Clear card"
                >
                    ×
                </button>
                <div
                    class="hole-card"
                    @click=${() => this.handleSlotClick(playerIndex, cardIndex)}
                >
                    <div class="card-content">
                        <span class="card-rank">${rankData?.label}</span>
                        <span
                            class="card-suit-icon"
                            style="color: ${suitData?.color || "#000"}"
                        >
                            ${suitData?.icon}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    renderPlayer(playerIndex: number): TemplateResult {
        const player = pokerBoardStore.players[playerIndex];
        if (!player) {
            return html``;
        }

        return html`
            <div class="player-hand">
                <div class="player-label">Player ${playerIndex + 1}</div>
                <div class="hole-cards">
                    ${this.renderCard(player[0], playerIndex, 0)}
                    ${this.renderCard(player[1], playerIndex, 1)}
                </div>
            </div>
        `;
    }

    render() {
        const players = pokerBoardStore.players;

        return html`
            <div class="player-hands-container">
                ${players.map((_, index) => this.renderPlayer(index))}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [PlayerHands.TAG_NAME]: PlayerHands;
    }
}
