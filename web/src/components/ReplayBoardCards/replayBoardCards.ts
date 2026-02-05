import { html, TemplateResult } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { Card } from "@common/interfaces";
import { SUITS, RANKS } from "../utilities";

/**
 * ReplayBoardCards - Display board cards during hand replay
 *
 * This component displays the community cards on the board.
 * It accepts cards via props and is not coupled to any store.
 */
@customElement("replay-board-cards")
export class ReplayBoardCards extends MobxLitElement {
    static readonly TAG_NAME = "replay-board-cards";
    static get styles() {
        return styles;
    }

    @property({ type: Array })
    boardCards: Card[] = [];

    /**
     * Render a single board card
     */
    renderCard(card: Card, index: number): TemplateResult {
        const suitData = SUITS.find((s) => s.suit === card.suit);
        const rankData = RANKS.find((r) => r.rank === card.rank);

        return html`
            <div class="board-card" data-index="${index}">
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

    /**
     * Render an empty card slot
     */
    renderEmptySlot(index: number): TemplateResult {
        return html`
            <div class="board-card-placeholder" data-index="${index}"></div>
        `;
    }

    render() {
        // Always show 5 slots, fill with cards as available
        const slots = [];
        for (let i = 0; i < 5; i++) {
            if (i < this.boardCards.length) {
                slots.push(this.renderCard(this.boardCards[i], i));
            } else {
                slots.push(this.renderEmptySlot(i));
            }
        }

        return html` <div class="board-cards-container">${slots}</div> `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [ReplayBoardCards.TAG_NAME]: ReplayBoardCards;
    }
}
