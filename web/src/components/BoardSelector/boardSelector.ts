import { html, TemplateResult } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { reaction } from "mobx";
import { Card } from "@common/interfaces";
import { cardStore, deckStore } from "../../stores/index";
import { SUITS, RANKS } from "../utilities";
import "../CardSelector";

@customElement("board-selector")
export class BoardSelector extends MobxLitElement {
    static readonly TAG_NAME = "board-selector";
    static get styles() {
        return styles;
    }

    constructor() {
        super();
        // React to card selection completion for board cards
        reaction(
            () => cardStore.selectedCard,
            (selectedCard) => {
                if (
                    selectedCard &&
                    cardStore.selectionStage === "complete" &&
                    cardStore.boardCardIndex < 5
                ) {
                    cardStore.addBoardCardToSelection(selectedCard);
                    this.requestUpdate();

                    // Equity calculation will be triggered automatically by EquityDisplay's reaction
                    // which watches cardStore.boardCards for changes

                    // Auto-start next selection if cards are still missing
                    if (cardStore.boardCards.length < 5) {
                        cardStore.startBoardSelection();
                    }
                }
            }
        );

        // Auto-start selection when board cards change and selection is needed
        reaction(
            () => [cardStore.boardCards.length, cardStore.boardCardIndex],
            ([boardCardsLength, boardCardIndex]) => {
                // Only auto-start if we're not already in the middle of a selection
                // and cards are missing
                if (
                    boardCardsLength < 5 &&
                    boardCardIndex === boardCardsLength &&
                    cardStore.selectionStage === "suit"
                ) {
                    cardStore.startBoardSelection();
                }
            },
            { fireImmediately: true }
        );
    }

    handleStartSelection() {
        if (cardStore.boardCards.length < 5) {
            cardStore.startBoardSelection();
        }
    }

    handleRemoveCard(card: Card, index: number) {
        deckStore.markCardAsUnselected(card);
        cardStore.removeBoardCard(card);
        // Auto-start selection if cards are missing
        if (cardStore.boardCards.length < 5) {
            cardStore.startBoardSelection();
        }
        // Equity calculation will be triggered automatically by EquityDisplay's reaction
        // which watches cardStore.boardCards for changes
    }

    handleNewHand() {
        // Reset all hole cards and board cards
        cardStore.holeCards.forEach((hole) => {
            if (hole) {
                hole.cards.forEach((card) => {
                    deckStore.markCardAsUnselected(card);
                });
            }
        });
        cardStore.boardCards.forEach((card) => {
            deckStore.markCardAsUnselected(card);
        });
        cardStore.resetHoleSelection();
        cardStore.setBoardCards([]);
        cardStore.resetBoardSelection();
    }

    handleNewBoard() {
        // Reset only board cards
        cardStore.boardCards.forEach((card) => {
            deckStore.markCardAsUnselected(card);
        });
        cardStore.setBoardCards([]);
        cardStore.resetBoardSelection();
    }

    getSelectionInstruction(): string {
        const boardCardsCount = cardStore.boardCards.length;
        if (boardCardsCount < 3) {
            return "Select Flop cards";
        } else if (boardCardsCount === 3) {
            return "Select Turn card";
        } else if (boardCardsCount === 4) {
            return "Select River card";
        }
        return "";
    }

    renderCard(card: Card | null, index: number): TemplateResult {
        if (!card) {
            return html`
                <div class="board-card-placeholder">
                    <span class="card-label">
                        ${index < 3 ? "Flop" : index === 3 ? "Turn" : "River"}
                    </span>
                </div>
            `;
        }

        const suitData = SUITS.find((s) => s.suit === card.suit);
        const rankData = RANKS.find((r) => r.rank === card.rank);

        return html`
            <div class="board-card">
                <button
                    class="remove-card-button"
                    @click=${() => this.handleRemoveCard(card, index)}
                    title="Remove card"
                >
                    ×
                </button>
                <div class="board-card-content">
                    <span class="board-card-rank">${rankData?.label}</span>
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

    render() {
        const boardCards = cardStore.boardCards;
        const canSelectMore = boardCards.length < 5;
        const allBoardCardsSelected = boardCards.length === 5;

        // Create array of 5 slots (flop: 0-2, turn: 3, river: 4)
        const boardSlots = Array.from({ length: 5 }, (_, i) => ({
            card: boardCards[i] || null,
            index: i,
        }));

        return html`
            <div class="board-selector-container">
                <div class="board-header">
                    <h3 class="board-selector-title">Board Cards</h3>
                    <div class="board-actions">
                        <sp-action-button
                            class="new-board-button"
                            size="s"
                            @click=${this.handleNewBoard}
                        >
                            New board
                        </sp-action-button>
                        <sp-action-button
                            class="new-hand-button"
                            size="s"
                            @click=${this.handleNewHand}
                        >
                            New hand
                        </sp-action-button>
                    </div>
                </div>
                <div class="board-cards-preview">
                    ${boardSlots.map(({ card, index }) =>
                        this.renderCard(card, index)
                    )}
                </div>
                ${canSelectMore
                    ? html`
                          <div class="selection-instruction">
                              ${this.getSelectionInstruction()}
                          </div>
                          <card-selector></card-selector>
                      `
                    : allBoardCardsSelected
                      ? html`
                            <div class="board-complete-message">
                                Board Complete (5 cards)
                            </div>
                        `
                      : html``}
            </div>
        `;
    }
}
