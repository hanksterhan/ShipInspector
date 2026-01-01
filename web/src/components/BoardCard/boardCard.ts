import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { Card } from "@common/interfaces";
import { plusIcon } from "../../assets";
import { SUITS, RANKS } from "../utilities";

/**
 * BoardCard component - Displays a single board card or placeholder
 * Can be clicked to select/clear the card
 */
@customElement("board-card")
export class BoardCard extends MobxLitElement {
    static readonly TAG_NAME = "board-card";
    static get styles() {
        return styles;
    }

    @property({ type: Object })
    card: Card | null = null;

    @property({ type: Number })
    boardIndex: number = 0;

    @property({ type: Boolean })
    isInScope: boolean = false;

    @property({ type: Function })
    onClick: ((boardIndex: number) => void) | null = null;

    @property({ type: Boolean })
    hasWinner: boolean = false;

    @property({ type: Boolean })
    isUsedInWinningHand: boolean = false;

    handleClick() {
        if (this.onClick) {
            this.onClick(this.boardIndex);
        }
    }

    render() {
        const isEmpty = this.card === null;

        if (isEmpty) {
            return html`
                <div
                    class="board-card-placeholder ${this.isInScope
                        ? "in-scope"
                        : ""}"
                    @click=${this.handleClick}
                >
                    <div class="board-card-placeholder-content">
                        <span class="board-card-placeholder-icon"
                            >${plusIcon}</span
                        >
                    </div>
                </div>
            `;
        }

        const suitData = SUITS.find((s) => s.suit === this.card!.suit);
        const rankData = RANKS.find((r) => r.rank === this.card!.rank);

        return html`
            <div
                class="board-card-display ${this.isInScope
                    ? "in-scope"
                    : ""} ${this.isUsedInWinningHand
                    ? "used-in-winning-hand"
                    : ""}"
                @click=${this.handleClick}
            >
                <div class="board-card-content">
                    <span class="board-card-rank"
                        >${rankData?.label || this.card!.rank}</span
                    >
                    <span
                        class="board-card-suit-icon"
                        style="color: ${suitData?.color || "#000"}"
                    >
                        ${suitData?.icon}
                    </span>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [BoardCard.TAG_NAME]: BoardCard;
    }
}
