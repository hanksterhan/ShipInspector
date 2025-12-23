import { html, TemplateResult } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { reaction } from "mobx";
import { replayStore, cardStore, deckStore } from "../../stores/index";
import { Card } from "@common/interfaces";
import { SUITS, RANKS } from "../utilities";
import "../CardSelector";

@customElement("player-cards-input")
export class PlayerCardsInput extends MobxLitElement {
    static readonly TAG_NAME = "player-cards-input";
    static get styles() {
        return styles;
    }

    selectedPlayerIndex: number | null = null;
    selectingCardIndex: number | null = null; // 0 or 1 for first or second card
    tempSelectedCards: [Card | null, Card | null] = [null, null];
    private reactionDisposer: (() => void) | null = null;

    constructor() {
        super();
        
        // React to card selection completion - similar to HoleSelector
        // Watch both selectedCard and selectionStage to catch when selection is complete
        this.reactionDisposer = reaction(
            () => ({
                selectedCard: cardStore.selectedCard,
                selectionStage: cardStore.selectionStage,
            }),
            ({ selectedCard, selectionStage }) => {
                // Only process if we're actively selecting a card for a player
                if (
                    selectedCard &&
                    selectionStage === "complete" &&
                    this.selectingCardIndex !== null &&
                    this.selectedPlayerIndex !== null
                ) {
                    // Immediately handle the card selection
                    this.handleCardSelect(selectedCard);
                    // Reset cardStore selection state
                    cardStore.resetSelection();
                }
            },
            { fireImmediately: false }
        );
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.reactionDisposer) {
            this.reactionDisposer();
            this.reactionDisposer = null;
        }
    }

    handlePlayerSelect(playerIndex: number) {
        this.selectedPlayerIndex = playerIndex;
        const player = replayStore.currentReplay?.players.find(
            (p) => p.index === playerIndex
        );
        if (player?.holeCards) {
            this.tempSelectedCards = [
                player.holeCards[0],
                player.holeCards[1],
            ];
        } else {
            this.tempSelectedCards = [null, null];
        }
        this.selectingCardIndex = null;
        this.requestUpdate();
    }

    handleCardSelect(card: Card) {
        if (
            this.selectedPlayerIndex === null ||
            this.selectingCardIndex === null
        ) {
            // Reset selection if we're not in a valid state
            cardStore.resetSelection();
            return;
        }

        // Check if card is already used by another player (excluding current player)
        const isCardUsed = replayStore.currentReplay?.players.some(
            (p) =>
                p.index !== this.selectedPlayerIndex &&
                p.holeCards &&
                ((p.holeCards[0].rank === card.rank &&
                    p.holeCards[0].suit === card.suit) ||
                    (p.holeCards[1].rank === card.rank &&
                        p.holeCards[1].suit === card.suit))
        );

        if (isCardUsed) {
            alert("This card is already assigned to another player");
            cardStore.resetSelection();
            return;
        }

        // Check if card is already in tempSelectedCards (same player)
        const isAlreadySelected = this.tempSelectedCards.some(
            (c) => c && c.rank === card.rank && c.suit === card.suit
        );

        if (isAlreadySelected) {
            alert("You've already selected this card for this player");
            cardStore.resetSelection();
            return;
        }

        // Check if card is in dead cards
        const isDeadCard = replayStore.currentReplay?.deadCards.some(
            (dc) => dc.card.rank === card.rank && dc.card.suit === card.suit
        );

        if (isDeadCard) {
            alert("This card is marked as dead");
            cardStore.resetSelection();
            deckStore.markCardAsUnselected(card);
            return;
        }

        // Check if card is on the board
        const isOnBoard = replayStore.currentReplay?.board.some(
            (bc) => bc.rank === card.rank && bc.suit === card.suit
        );

        if (isOnBoard) {
            alert("This card is on the board");
            cardStore.resetSelection();
            deckStore.markCardAsUnselected(card);
            return;
        }

        // Create a new array to ensure reactivity
        const newCards: [Card | null, Card | null] = [
            this.tempSelectedCards[0],
            this.tempSelectedCards[1],
        ];
        newCards[this.selectingCardIndex] = card;
        this.tempSelectedCards = newCards;
        
        // Unmark the card from deckStore so it can be used again if needed
        // (for replay, we don't want cards permanently marked as selected)
        deckStore.markCardAsUnselected(card);
        
        this.selectingCardIndex = null;
        // Force update to show the selected card
        this.requestUpdate();
    }

    handleSaveCards() {
        if (this.selectedPlayerIndex === null) return;

        if (!this.tempSelectedCards[0] || !this.tempSelectedCards[1]) {
            alert("Please select both cards");
            return;
        }

        // Ensure both cards are valid
        const card1 = this.tempSelectedCards[0];
        const card2 = this.tempSelectedCards[1];
        
        if (!card1 || !card2) {
            alert("Please select both cards");
            return;
        }

        replayStore.setPlayerHoleCards(this.selectedPlayerIndex, [card1, card2]);

        // Reset selection
        const savedPlayerIndex = this.selectedPlayerIndex;
        this.selectedPlayerIndex = null;
        this.selectingCardIndex = null;
        this.tempSelectedCards = [null, null];
        
        // Show confirmation
        alert(`Cards saved for Player ${savedPlayerIndex + 1}`);
        this.requestUpdate();
    }

    handleClearCards() {
        if (this.selectedPlayerIndex === null) return;
        replayStore.setPlayerHoleCards(this.selectedPlayerIndex, undefined);
        this.tempSelectedCards = [null, null];
        this.selectingCardIndex = null;
        this.requestUpdate();
    }

    handleStartCardSelection(cardIndex: number) {
        if (this.selectedPlayerIndex === null) {
            alert("Please select a player first");
            return;
        }
        // Set which card we're selecting
        this.selectingCardIndex = cardIndex;
        // Reset cardStore selection to start fresh - this ensures we're ready for a new selection
        // This is important - it clears any previous selection state
        cardStore.resetSelection();
        // Force update to show the card selector
        this.requestUpdate();
    }

    handleCancelSelection() {
        this.selectingCardIndex = null;
        this.requestUpdate();
    }

    renderCard(card: Card | null, index: number): TemplateResult {
        if (!card) {
            return html`
                <div class="card-placeholder" @click=${() => this.handleStartCardSelection(index)}>
                    <span>Card ${index + 1}</span>
                </div>
            `;
        }

        const suitData = SUITS.find((s) => s.suit === card.suit);
        const rankData = RANKS.find((r) => r.rank === card.rank);

        return html`
            <div class="card-display" @click=${() => this.handleStartCardSelection(index)}>
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
        `;
    }

    render() {
        if (!replayStore.currentReplay) {
            return html``;
        }

        const players = replayStore.currentReplay.players;
        if (players.length === 0) {
            return html`
                <div class="player-cards-container">
                    <p>Please add players first</p>
                </div>
            `;
        }

        const isSelectingCard = this.selectingCardIndex !== null;

        return html`
            <div class="player-cards-container">
                <h4>Player Cards</h4>
                <p class="instruction">
                    Select a player to enter their hole cards. You can mark
                    cards as known after showdown.
                </p>

                <div class="players-grid">
                    ${players.map((player) => {
                        const isSelected =
                            this.selectedPlayerIndex === player.index;
                        const cards = isSelected
                            ? this.tempSelectedCards
                            : player.holeCards
                              ? [player.holeCards[0], player.holeCards[1]]
                              : [null, null];

                        return html`
                            <div
                                class="player-card-section ${isSelected
                                    ? "selected"
                                    : ""}"
                            >
                                <div class="player-header">
                                    <h5>
                                        Player ${player.index + 1}
                                        ${player.name ? `(${player.name})` : ""}
                                    </h5>
                                    <button
                                        @click=${() =>
                                            this.handlePlayerSelect(player.index)}
                                        class="select-button"
                                    >
                                        ${isSelected ? "Selected" : "Select"}
                                    </button>
                                </div>

                                ${isSelected
                                    ? html`
                                          <div class="cards-preview">
                                              ${this.renderCard(cards[0], 0)}
                                              ${this.renderCard(cards[1], 1)}
                                          </div>

                                          ${isSelectingCard && this.selectedPlayerIndex === player.index
                                              ? html`
                                                    <div class="card-selection">
                                                        <div class="selection-instruction">
                                                            Select Card ${this.selectingCardIndex! + 1}
                                                        </div>
                                                        <card-selector></card-selector>
                                                        <div class="selection-actions">
                                                            <button
                                                                @click=${this
                                                                    .handleCancelSelection}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                `
                                              : html`
                                                    <div class="card-actions">
                                                        <button
                                                            @click=${() =>
                                                                this.handleStartCardSelection(
                                                                    0
                                                                )}
                                                        >
                                                            Select Card 1
                                                        </button>
                                                        <button
                                                            @click=${() =>
                                                                this.handleStartCardSelection(
                                                                    1
                                                                )}
                                                        >
                                                            Select Card 2
                                                        </button>
                                                    </div>
                                                `}

                                          <div class="save-actions">
                                              <button
                                                  @click=${this.handleSaveCards}
                                                  class="save-button"
                                              >
                                                  Save Cards
                                              </button>
                                              <button
                                                  @click=${this.handleClearCards}
                                                  class="clear-button"
                                              >
                                                  Clear
                                              </button>
                                          </div>
                                      `
                                    : html`
                                          <div class="cards-preview">
                                              ${this.renderCard(cards[0], 0)}
                                              ${this.renderCard(cards[1], 1)}
                                          </div>
                                          ${player.holeCards
                                              ? html`
                                                    <p class="cards-status">
                                                        Cards entered
                                                    </p>
                                                `
                                              : html`
                                                    <p class="cards-status unknown">
                                                        Cards unknown
                                                    </p>
                                                `}
                                      `}
                            </div>
                        `;
                    })}
                </div>
            </div>
        `;
    }

}

declare global {
    interface HTMLElementTagNameMap {
        [PlayerCardsInput.TAG_NAME]: PlayerCardsInput;
    }
}

