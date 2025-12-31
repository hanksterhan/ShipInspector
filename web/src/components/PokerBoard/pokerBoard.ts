import { html, TemplateResult } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { Card } from "@common/interfaces";
import { pokerBoardStore } from "../../stores/index";
import { SUITS, RANKS } from "../utilities";
import { plusIcon } from "../../assets";

@customElement("poker-board")
export class PokerBoard extends MobxLitElement {
    static readonly TAG_NAME = "poker-board";
    static get styles() {
        return styles;
    }

    handleSlotClick(boardIndex: number) {
        // Set scope to this board slot
        pokerBoardStore.setScope({ kind: "board", boardIndex });
        // Open picker
        pokerBoardStore.openPicker();
    }

    handleClearCard(boardIndex: number) {
        pokerBoardStore.clearCard({ kind: "board", boardIndex });
    }

    isInScope(boardIndex: number): boolean {
        return (
            pokerBoardStore.scope.kind === "board" &&
            pokerBoardStore.scope.boardIndex === boardIndex
        );
    }

    getStageLabel(boardIndex: number): string {
        if (boardIndex < 3) {
            return "Flop";
        } else if (boardIndex === 3) {
            return "Turn";
        } else {
            return "River";
        }
    }

    renderCard(card: Card | null, boardIndex: number): TemplateResult {
        const isInScope = this.isInScope(boardIndex);
        const stageLabel = this.getStageLabel(boardIndex);

        if (!card) {
            return html`
                <div
                    class="board-slot ${isInScope ? "in-scope" : ""}"
                    @click=${() => this.handleSlotClick(boardIndex)}
                >
                    <div class="card-back"></div>
                    <div class="plus-overlay">${plusIcon}</div>
                    <div class="stage-label">${stageLabel}</div>
                </div>
            `;
        }

        const suitData = SUITS.find((s) => s.suit === card.suit);
        const rankData = RANKS.find((r) => r.rank === card.rank);

        return html`
            <div class="board-slot ${isInScope ? "in-scope" : ""}">
                <button
                    class="clear-button"
                    @click=${(e: Event) => {
                        e.stopPropagation();
                        this.handleClearCard(boardIndex);
                    }}
                    title="Clear card"
                    aria-label="Clear card"
                >
                    ×
                </button>
                <div
                    class="board-card"
                    @click=${() => this.handleSlotClick(boardIndex)}
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
                <div class="stage-label">${stageLabel}</div>
            </div>
        `;
    }

    render() {
        const board = pokerBoardStore.board;

        return html`
            <div class="poker-board-container">
                <div class="board-title">Community Cards</div>
                <div class="board-slots">
                    ${board.map((card, index) => this.renderCard(card, index))}
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [PokerBoard.TAG_NAME]: PokerBoard;
    }
}
