import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { Card } from "@common/interfaces";
import { pokerBoardStore, deckStore } from "../../stores/index";
import "../../components/BoardCardSlot";

/**
 * BoardCardContainer component - Container for all board cards
 * Handles board card clicks and scope management
 */
@customElement("board-card-container")
export class BoardCardContainer extends MobxLitElement {
    static readonly TAG_NAME = "board-card-container";
    static get styles() {
        return styles;
    }

    /**
     * Check if a board card slot is currently in scope
     */
    isBoardCardInScope(boardIndex: number): boolean {
        // No blue glow if river card is selected or board is complete
        const board = pokerBoardStore.board;
        const riverCardSelected = board[4] !== null;
        const boardComplete = pokerBoardStore.isBoardComplete();
        if (riverCardSelected || boardComplete) {
            return false;
        }

        const scope = pokerBoardStore.scope;
        return scope.kind === "board" && scope.boardIndex === boardIndex;
    }

    /**
     * Handle board card click
     */
    handleBoardCardClick(boardIndex: number) {
        const currentCard = pokerBoardStore.board[boardIndex];
        const scope = {
            kind: "board" as const,
            boardIndex,
        };

        // If card is already selected, clear it
        if (currentCard !== null) {
            // Collect all cards that will be cleared (cascading clear from this index onwards)
            const cardsToUnmark: Card[] = [];
            for (let i = boardIndex; i < 5; i++) {
                const card = pokerBoardStore.board[i];
                if (card !== null) {
                    cardsToUnmark.push(card);
                }
            }

            pokerBoardStore.setScope(scope);
            pokerBoardStore.clearCard(scope);

            // Unmark all cleared cards from deckStore
            cardsToUnmark.forEach((card) => {
                deckStore.markCardAsUnselected(card);
            });

            pokerBoardStore.closePicker();
        } else {
            // If card is empty, open picker
            pokerBoardStore.setScope(scope);
            pokerBoardStore.openPicker();
        }
    }

    render() {
        // Access store properties to ensure MobX reactivity
        const board = pokerBoardStore.board;
        // Scope is accessed in isBoardCardInScope() method for reactivity
        const hasWinner = pokerBoardStore.hasWinner();
        const boardCardsUsedInWinningHand =
            pokerBoardStore.boardCardsUsedInWinningHand;
        const winningHandName = pokerBoardStore.getWinningHandName();

        return html`
            <div class="board-cards-wrapper">
                <div
                    class="board-cards-container ${hasWinner
                        ? "has-winner"
                        : ""}"
                >
                    ${board.map(
                        (card, index) => html`
                            <board-card-slot
                                .card=${card}
                                .boardIndex=${index}
                                .isInScope=${this.isBoardCardInScope(index)}
                                .onClick=${this.handleBoardCardClick.bind(this)}
                                .hasWinner=${hasWinner}
                                .isUsedInWinningHand=${boardCardsUsedInWinningHand.has(
                                    index
                                )}
                            ></board-card-slot>
                        `
                    )}
                </div>
                ${winningHandName
                    ? html`<div class="winning-hand-name">
                          ${winningHandName}
                      </div>`
                    : null}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [BoardCardContainer.TAG_NAME]: BoardCardContainer;
    }
}
