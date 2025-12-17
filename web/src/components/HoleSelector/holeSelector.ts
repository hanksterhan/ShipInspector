import { html, TemplateResult } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { reaction } from "mobx";
import { Card } from "@common/interfaces";
import { cardStore, settingsStore } from "../../stores/index";
import { SUITS, RANKS } from "../utilities";
import "../CardSelector";

@customElement("hole-selector")
export class HoleSelector extends MobxLitElement {
    static readonly TAG_NAME = "hole-selector";
    static get styles() {
        return styles;
    }

    constructor() {
        super();
        // React to card selection completion (only for hole selection)
        reaction(
            () => cardStore.selectedCard,
            (selectedCard) => {
                // Only process if we're actively selecting hole cards
                // (not board cards - board selection happens when all holes are selected)
                const allHolesSelected =
                    cardStore.holeCards.filter((h) => h !== undefined)
                        .length === settingsStore.players;
                const isSelectingHole =
                    cardStore.holeCardIndex < 2 &&
                    cardStore.currentPlayer < settingsStore.players;

                if (
                    selectedCard &&
                    cardStore.selectionStage === "complete" &&
                    !allHolesSelected &&
                    isSelectingHole
                ) {
                    cardStore.addHoleCardToSelection(selectedCard);
                    this.requestUpdate();

                    // Equity calculation will be triggered automatically by EquityDisplay's reaction
                    // which watches cardStore.holeCards for changes
                }
            }
        );
    }

    handleStartSelection() {
        const selectedHolesCount = cardStore.holeCards.filter(
            (hole) => hole !== undefined
        ).length;
        const nextPlayer = selectedHolesCount;
        if (nextPlayer < settingsStore.players) {
            cardStore.startHoleSelectionForPlayer(nextPlayer);
        }
    }

    renderCard(card: Card | null, index: number): TemplateResult {
        if (!card) {
            return html`
                <div class="hole-card-placeholder">
                    <span class="card-number">Card ${index + 1}</span>
                </div>
            `;
        }

        const suitData = SUITS.find((s) => s.suit === card.suit);
        const rankData = RANKS.find((r) => r.rank === card.rank);

        return html`
            <div class="hole-card">
                <div class="hole-card-content">
                    <span class="hole-card-rank">${rankData?.label}</span>
                    <span
                        class="hole-card-suit-icon"
                        style="color: ${suitData?.color || "#000"}"
                    >
                        ${suitData?.icon}
                    </span>
                </div>
            </div>
        `;
    }

    render() {
        const firstCard = cardStore.selectedHoleCards[0] || null;
        const secondCard = cardStore.selectedHoleCards[1] || null;
        const isSelectingFirst =
            cardStore.holeCardIndex === 0 &&
            cardStore.selectedHoleCards.length === 0;
        const isSelectingSecond =
            cardStore.holeCardIndex === 1 &&
            cardStore.selectedHoleCards.length === 1;
        const hasExistingHole =
            cardStore.holeCards[cardStore.currentPlayer] !== undefined;
        const existingHole = hasExistingHole
            ? cardStore.holeCards[cardStore.currentPlayer]
            : null;
        const selectedHolesCount = cardStore.holeCards.filter(
            (hole) => hole !== undefined
        ).length;
        const canSelectMore = selectedHolesCount < settingsStore.players;

        return html`
            <div class="hole-selector-container">
                <h3 class="hole-selector-title">
                    Player ${cardStore.currentPlayer + 1} Hand
                </h3>
                <div class="hole-cards-preview">
                    ${this.renderCard(
                        firstCard || existingHole?.cards[0] || null,
                        0
                    )}
                    ${this.renderCard(
                        secondCard || existingHole?.cards[1] || null,
                        1
                    )}
                </div>
                ${isSelectingFirst
                    ? html`
                          <div class="selection-instruction">
                              Select the first card
                          </div>
                          <card-selector></card-selector>
                      `
                    : isSelectingSecond
                      ? html`
                            <div class="selection-instruction">
                                Select the second card
                            </div>
                            <card-selector></card-selector>
                        `
                      : hasExistingHole && canSelectMore
                        ? html`
                              <div class="hole-complete-message">
                                  Player ${cardStore.currentPlayer + 1} Hand
                              </div>
                              <sp-action-button
                                  class="start-selection-button"
                                  size="m"
                                  @click=${this.handleStartSelection}
                              >
                                  Select Next Player
                              </sp-action-button>
                          `
                        : canSelectMore
                          ? html`
                                <sp-action-button
                                    class="start-selection-button"
                                    size="m"
                                    @click=${this.handleStartSelection}
                                >
                                    Start Selection
                                </sp-action-button>
                            `
                          : html``}
            </div>
        `;
    }
}
