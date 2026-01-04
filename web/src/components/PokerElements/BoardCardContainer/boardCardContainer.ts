import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { Card } from "@common/interfaces";
import {
    pokerBoardStore,
    deckStore,
    handBuilderStore,
} from "../../../stores/index";

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
        const board = pokerBoardStore.board;
        const boardComplete = pokerBoardStore.isBoardComplete();

        // If board is complete, no highlighting
        if (boardComplete) {
            return false;
        }

        // If hand has started, highlight board cards based on betting round completion
        if (handBuilderStore.handStarted) {
            const bettingComplete = handBuilderStore.isBettingRoundComplete;
            const currentStreet = handBuilderStore.current_street;

            // When betting is complete, highlight the next board cards to be dealt
            if (bettingComplete) {
                // After preflop betting, highlight flop cards
                if (currentStreet === "PREFLOP" || currentStreet === "FLOP") {
                    const flopCardsSet =
                        board[0] !== null &&
                        board[1] !== null &&
                        board[2] !== null;
                    if (!flopCardsSet) {
                        // Highlight the first empty flop card slot
                        if (board[0] === null) {
                            return boardIndex === 0;
                        } else if (board[1] === null) {
                            return boardIndex === 1;
                        } else if (board[2] === null) {
                            return boardIndex === 2;
                        }
                    }
                }

                // After flop betting, highlight turn card
                if (currentStreet === "TURN") {
                    const turnCardSet = board[3] !== null;
                    if (!turnCardSet) {
                        return boardIndex === 3;
                    }
                }

                // After turn betting, highlight river card
                if (currentStreet === "RIVER") {
                    const riverCardSet = board[4] !== null;
                    if (!riverCardSet) {
                        return boardIndex === 4;
                    }
                }
            } else {
                // Betting not complete - highlight based on street and cards set
                // When waiting for flop (FLOP street but flop cards not all set)
                if (currentStreet === "FLOP") {
                    const flopCardsSet =
                        board[0] !== null &&
                        board[1] !== null &&
                        board[2] !== null;
                    if (!flopCardsSet) {
                        // Highlight flop cards (indices 0, 1, 2)
                        return boardIndex >= 0 && boardIndex <= 2;
                    }
                }

                // When waiting for turn (TURN street but turn card not set)
                if (currentStreet === "TURN") {
                    const turnCardSet = board[3] !== null;
                    if (!turnCardSet) {
                        // Highlight turn card (index 3)
                        return boardIndex === 3;
                    }
                }

                // When waiting for river (RIVER street but river card not set)
                if (currentStreet === "RIVER") {
                    const riverCardSet = board[4] !== null;
                    if (!riverCardSet) {
                        // Highlight river card (index 4)
                        return boardIndex === 4;
                    }
                }
            }

            // No highlighting for other cases
            return false;
        }

        // Before hand starts, use scope-based highlighting
        const riverCardSelected = board[4] !== null;
        if (riverCardSelected) {
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
