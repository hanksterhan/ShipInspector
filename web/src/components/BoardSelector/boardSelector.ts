import { html, TemplateResult } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { reaction } from "mobx";
import { Card } from "@common/interfaces";
import { cardStore, deckStore } from "../../stores/index";
import { SUITS, RANKS } from "../utilities";
import "../CardSelector";
import "../OutsDisplay";

@customElement("board-selector")
export class BoardSelector extends MobxLitElement {
    static readonly TAG_NAME = "board-selector";
    static get styles() {
        return styles;
    }

    @property({ type: Boolean })
    private isOpen: boolean | undefined = undefined;

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

    handleAccordionToggle = (event: Event) => {
        const target = event.target as any;
        // Spectrum accordion-item fires toggle event with detail.open
        const detail = (event as CustomEvent).detail;
        if (detail && typeof detail.open === "boolean") {
            this.isOpen = detail.open;
        } else if (target && typeof target.open === "boolean") {
            this.isOpen = target.open;
        }
        this.requestUpdate();
    };

    render() {
        const boardCards = cardStore.boardCards;
        const canSelectMore = boardCards.length < 5;
        const allBoardCardsSelected = boardCards.length === 5;
        const hasBoardCards = boardCards.length > 0;

        // Create array of 5 slots (flop: 0-2, turn: 3, river: 4)
        const boardSlots = Array.from({ length: 5 }, (_, i) => ({
            card: boardCards[i] || null,
            index: i,
        }));

        // Auto-open accordion if board has cards or if user is selecting
        // Default to closed for pre-flop focus
        const defaultOpen = hasBoardCards || canSelectMore;
        const accordionOpen =
            this.isOpen !== undefined ? this.isOpen : defaultOpen;

        // Show outs display for heads-up (2 players) on the turn (4 board cards)
        const selectedHolesCount = cardStore.holeCards.filter(
            (hole) => hole !== undefined
        ).length;
        const showOuts = selectedHolesCount === 2 && boardCards.length === 4;

        return html`
            <div class="board-selector-container">
                <sp-accordion>
                    <sp-accordion-item
                        label="Board Cards"
                        .open=${accordionOpen}
                        @toggle=${this.handleAccordionToggle}
                    >
                        <div class="board-content">
                            <div class="board-cards-preview">
                                ${boardSlots.map(({ card, index }) =>
                                    this.renderCard(card, index)
                                )}
                            </div>
                            ${showOuts
                                ? html`
                                      <div class="outs-container">
                                          <outs-display
                                              .playerIndex=${0}
                                          ></outs-display>
                                      </div>
                                  `
                                : html``}
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
                    </sp-accordion-item>
                </sp-accordion>
            </div>
        `;
    }
}
