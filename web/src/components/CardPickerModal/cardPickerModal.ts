import { html, TemplateResult } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { reaction } from "mobx";
import { Card, CardRank, CardSuit } from "@common/interfaces";
import { pokerBoardStore } from "../../stores/index";
import { SUITS, RANKS } from "../utilities";
import { closeIcon } from "../../assets";

@customElement("card-picker-modal")
export class CardPickerModal extends MobxLitElement {
    static readonly TAG_NAME = "card-picker-modal";
    static get styles() {
        return styles;
    }

    private highlightedCard: Card | null = null;
    private reactionDisposer: (() => void) | null = null;

    connectedCallback() {
        super.connectedCallback();
        // Handle keyboard events
        this.addEventListener("keydown", this.handleKeyDown);

        // Watch for picker open/close to handle focus
        this.reactionDisposer = reaction(
            () => pokerBoardStore.pickerOpen,
            (isOpen) => {
                if (isOpen) {
                    // Focus the modal when it opens
                    requestAnimationFrame(() => {
                        const modalContent = this.shadowRoot?.querySelector(
                            ".modal-content"
                        ) as HTMLElement;
                        if (modalContent) {
                            modalContent.focus();
                        }
                    });
                }
            }
        );
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener("keydown", this.handleKeyDown);
        if (this.reactionDisposer) {
            this.reactionDisposer();
            this.reactionDisposer = null;
        }
    }

    handleKeyDown = (e: KeyboardEvent) => {
        if (!pokerBoardStore.pickerOpen) return;

        // Escape closes picker
        if (e.key === "Escape") {
            pokerBoardStore.closePicker();
            e.preventDefault();
            return;
        }

        // Enter selects highlighted card
        if (e.key === "Enter" && this.highlightedCard) {
            this.handleCardClick(this.highlightedCard);
            e.preventDefault();
            return;
        }

        // Arrow key navigation (optional enhancement)
        // This is a basic implementation - can be enhanced
    };

    handleCardClick(card: Card) {
        // Check if card is already used
        if (pokerBoardStore.isCardUsed(card)) {
            return;
        }

        // Set card and auto-advance scope
        if (pokerBoardStore.setCard(card)) {
            // Close picker after selection
            pokerBoardStore.closePicker();
        }
    }

    handleDone() {
        pokerBoardStore.closePicker();
    }

    handleReset() {
        pokerBoardStore.resetAll();
        pokerBoardStore.closePicker();
    }

    handleCardMouseEnter(card: Card) {
        this.highlightedCard = card;
    }

    handleCardMouseLeave() {
        this.highlightedCard = null;
    }

    renderCard(card: Card): TemplateResult {
        const isUsed = pokerBoardStore.isCardUsed(card);
        const isHighlighted =
            this.highlightedCard &&
            this.highlightedCard.rank === card.rank &&
            this.highlightedCard.suit === card.suit;

        const suitData = SUITS.find((s) => s.suit === card.suit);
        const rankData = RANKS.find((r) => r.rank === card.rank);

        return html`
            <button
                class="card-button ${isUsed ? "disabled" : ""} ${isHighlighted
                    ? "highlighted"
                    : ""}"
                ?disabled=${isUsed}
                @click=${() => this.handleCardClick(card)}
                @mouseenter=${() => this.handleCardMouseEnter(card)}
                @mouseleave=${() => this.handleCardMouseLeave()}
                title=${isUsed
                    ? "Card already used"
                    : `${rankData?.label} ${suitData?.label}`}
            >
                <div class="card-button-content">
                    <span class="card-rank">${rankData?.label}</span>
                    <span
                        class="card-suit-icon"
                        style="color: ${suitData?.color || "#000"}"
                    >
                        ${suitData?.icon}
                    </span>
                </div>
            </button>
        `;
    }

    render() {
        if (!pokerBoardStore.pickerOpen) {
            return html``;
        }

        // Generate all 52 cards
        const allCards: Card[] = [];
        for (const suit of ["c", "d", "h", "s"] as CardSuit[]) {
            for (const rank of [
                2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
            ] as CardRank[]) {
                allCards.push({ rank, suit });
            }
        }

        // Group by suit for display (similar to PokerListings)
        const cardsBySuit = SUITS.map((suitData) => ({
            suit: suitData,
            cards: allCards.filter((c) => c.suit === suitData.suit),
        }));

        return html`
            <div class="modal-overlay" @click=${this.handleDone}>
                <div
                    class="modal-content"
                    tabindex="-1"
                    @click=${(e: Event) => e.stopPropagation()}
                >
                    <div class="modal-header">
                        <h2 class="modal-title">Select a Card</h2>
                        <button
                            class="close-button"
                            @click=${this.handleDone}
                            aria-label="Close"
                        >
                            ${closeIcon}
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="card-grid">
                            ${cardsBySuit.map(
                                ({ suit, cards }) => html`
                                    <div class="suit-row">
                                        <div class="suit-label">
                                            ${suit.label}
                                        </div>
                                        <div class="rank-row">
                                            ${cards.map((card) =>
                                                this.renderCard(card)
                                            )}
                                        </div>
                                    </div>
                                `
                            )}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button
                            class="action-button done-button"
                            @click=${this.handleDone}
                        >
                            Done
                        </button>
                        <button
                            class="action-button reset-button"
                            @click=${this.handleReset}
                        >
                            Reset Cards
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [CardPickerModal.TAG_NAME]: CardPickerModal;
    }
}
