import { html, TemplateResult } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { reaction } from "mobx";
import { Card } from "@common/interfaces";
import { cardStore } from "../../stores/index";
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
        // React to card selection completion
        reaction(
            () => cardStore.selectedCard,
            (selectedCard) => {
                if (selectedCard && cardStore.selectionStage === "complete") {
                    cardStore.addHoleCardToSelection(selectedCard);
                    this.requestUpdate();
                }
            }
        );
    }

    handleStartSelection() {
        const selectedHolesCount = cardStore.holeCards.filter(
            (hole) => hole !== undefined
        ).length;
        const nextPlayer = selectedHolesCount;
        if (nextPlayer < cardStore.players) {
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

    renderSelectedHoles(): TemplateResult {
        const holesWithIndices = cardStore.holeCards
            .map((hole, index) => ({ hole, playerIndex: index }))
            .filter((item) => item.hole !== undefined);

        if (holesWithIndices.length === 0) {
            return html``;
        }

        return html`
            <div class="selected-holes-section">
                <h4 class="selected-holes-title">Selected Holes</h4>
                <div class="selected-holes-grid">
                    ${holesWithIndices.map(
                        ({ hole, playerIndex }) => html`
                            <div class="player-hole-container">
                                <div class="player-label">
                                    Player ${playerIndex + 1}
                                </div>
                                <div class="player-hole-cards">
                                    ${this.renderCard(hole.cards[0], 0)}
                                    ${this.renderCard(hole.cards[1], 1)}
                                </div>
                            </div>
                        `
                    )}
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
        const canSelectMore = selectedHolesCount < cardStore.players;
        const allHolesSelected = selectedHolesCount === cardStore.players;

        return html`
            <div class="hole-selector-container">
                ${allHolesSelected
                    ? html`
                          <h3 class="hole-selector-title">
                              All Holes Selected
                          </h3>
                          ${this.renderSelectedHoles()}
                      `
                    : html`
                          <h3 class="hole-selector-title">
                              Player ${cardStore.currentPlayer + 1} - Select
                              Hole Cards
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
                                            Hole cards selected for Player
                                            ${cardStore.currentPlayer + 1}
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
                                              @click=${this
                                                  .handleStartSelection}
                                          >
                                              Start Selection
                                          </sp-action-button>
                                      `
                                    : html``}
                      `}
                ${!allHolesSelected ? this.renderSelectedHoles() : ""}
            </div>
        `;
    }
}
