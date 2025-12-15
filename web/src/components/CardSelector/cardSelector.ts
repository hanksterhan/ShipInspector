import { html, TemplateResult } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { CardSuit, CardRank, Card } from "@common/interfaces";
import { cardStore, deckStore } from "../../stores/index";
import { SUITS, RANKS } from "../utilities";

@customElement("card-selector")
export class CardSelector extends MobxLitElement {
    static readonly TAG_NAME = "card-selector";
    static get styles() {
        return styles;
    }

    handleSuitClick(suit: CardSuit) {
        cardStore.setSelectedSuit(suit);
    }

    handleRankClick(rank: CardRank) {
        if (cardStore.selectedSuit) {
            const card: Card = { rank, suit: cardStore.selectedSuit };
            // Only allow selection if card is not already selected
            if (!deckStore.isCardSelected(card)) {
                deckStore.markCardAsSelected(card);
                cardStore.setSelectedRank(rank);
            }
        }
    }

    handleReset() {
        cardStore.resetSelection();
    }

    renderSuitSelection(): TemplateResult {
        return html`
            <div class="selection-stage">
                <h3 class="stage-title">Select a Suit</h3>
                <div class="suit-grid">
                    ${SUITS.map(
                        (suitData) => html`
                            <sp-action-button
                                class="suit-button"
                                size="xl"
                                @click=${() =>
                                    this.handleSuitClick(suitData.suit)}
                            >
                                <div class="suit-button-content">
                                    <span
                                        class="suit-icon"
                                        style="color: ${suitData.color}"
                                    >
                                        ${suitData.icon}
                                    </span>
                                </div>
                            </sp-action-button>
                        `
                    )}
                </div>
            </div>
        `;
    }

    renderRankSelection(): TemplateResult {
        const selectedSuitData = SUITS.find(
            (s) => s.suit === cardStore.selectedSuit
        );
        const numberRanks = RANKS.filter((r) => r.rank >= 2 && r.rank <= 10);
        const faceRanks = RANKS.filter((r) => r.rank >= 11);
        return html`
            <div class="selection-stage">
                <h3 class="stage-title">Select a Card</h3>
                <div class="rank-grid">
                    <div class="rank-row">
                        ${numberRanks.map(
                            (rankData) => {
                                const card: Card = {
                                    rank: rankData.rank,
                                    suit: cardStore.selectedSuit!,
                                };
                                const isSelected = deckStore.isCardSelected(card);
                                return html`
                                    <sp-action-button
                                        class="rank-button"
                                        size="s"
                                        ?disabled=${isSelected}
                                        ?selected=${isSelected}
                                        @click=${() =>
                                            this.handleRankClick(rankData.rank)}
                                    >
                                        <div class="rank-button-content">
                                            <span class="rank-label"
                                                >${rankData.label}</span
                                            >
                                            <span
                                                class="rank-suit-icon"
                                                style="color: ${selectedSuitData?.color ||
                                                "#000"}"
                                            >
                                                ${selectedSuitData?.icon}
                                            </span>
                                        </div>
                                    </sp-action-button>
                                `;
                            }
                        )}
                    </div>
                    <div class="rank-row">
                        ${faceRanks.map(
                            (rankData) => {
                                const card: Card = {
                                    rank: rankData.rank,
                                    suit: cardStore.selectedSuit!,
                                };
                                const isSelected = deckStore.isCardSelected(card);
                                return html`
                                    <sp-action-button
                                        class="rank-button"
                                        size="s"
                                        ?disabled=${isSelected}
                                        ?selected=${isSelected}
                                        @click=${() =>
                                            this.handleRankClick(rankData.rank)}
                                    >
                                        <div class="rank-button-content">
                                            <span class="rank-label"
                                                >${rankData.label}</span
                                            >
                                            <span
                                                class="rank-suit-icon"
                                                style="color: ${selectedSuitData?.color ||
                                                "#000"}"
                                            >
                                                ${selectedSuitData?.icon}
                                            </span>
                                        </div>
                                    </sp-action-button>
                                `;
                            }
                        )}
                    </div>
                </div>
                <sp-action-button
                    class="back-button"
                    size="m"
                    @click=${this.handleReset}
                >
                    Back to Suits
                </sp-action-button>
            </div>
        `;
    }

    renderCompleteSelection(): TemplateResult {
        const selectedSuitData = SUITS.find(
            (s) => s.suit === cardStore.selectedCard?.suit
        );
        const selectedRankData = RANKS.find(
            (r) => r.rank === cardStore.selectedCard?.rank
        );
        return html`
            <div class="selection-stage complete">
                <div class="selected-card-display">
                    <div class="card-display-content">
                        <span class="card-rank"
                            >${selectedRankData?.label}</span
                        >
                        <span
                            class="card-suit-icon"
                            style="color: ${selectedSuitData?.color || "#000"}"
                        >
                            ${selectedSuitData?.icon}
                        </span>
                    </div>
                </div>
                <div class="button-group">
                    <sp-action-button
                        class="reset-button"
                        size="m"
                        @click=${this.handleReset}
                    >
                        Select Another Card
                    </sp-action-button>
                    ${cardStore.selectedCard
                        ? html`
                              <sp-action-button
                                  class="unselect-button"
                                  size="m"
                                  @click=${() => {
                                      if (cardStore.selectedCard) {
                                          deckStore.markCardAsUnselected(
                                              cardStore.selectedCard
                                          );
                                          cardStore.clearSelectedCard();
                                      }
                                  }}
                              >
                                  Unselect Card
                              </sp-action-button>
                          `
                        : ""}
                </div>
            </div>
        `;
    }

    render() {
        return html`
            <div class="card-selector-container">
                ${cardStore.selectionStage === "suit"
                    ? this.renderSuitSelection()
                    : ""}
                ${cardStore.selectionStage === "rank"
                    ? this.renderRankSelection()
                    : ""}
                ${cardStore.selectionStage === "complete"
                    ? this.renderCompleteSelection()
                    : ""}
            </div>
        `;
    }
}
