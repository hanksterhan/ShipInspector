import { html, TemplateResult } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { Card } from "@common/interfaces";
import { pokerBoardStore, deckStore } from "../../stores/index";
import { SUITS, RANKS } from "../utilities";
import { plusIcon, crownIcon, dealerIcon } from "../../assets";

@customElement("poker-player")
export class Player extends MobxLitElement {
    static readonly TAG_NAME = "poker-player";
    static get styles() {
        return styles;
    }

    // Player index (0-based)
    @property({ type: Number })
    playerIndex: number = 0;

    /**
     * Check if this card slot is currently in scope
     */
    isCardInScope(cardIndex: 0 | 1): boolean {
        // No blue glow if river card is selected or board is complete
        const board = pokerBoardStore.board;
        const riverCardSelected = board[4] !== null;
        const boardComplete = pokerBoardStore.isBoardComplete();
        if (riverCardSelected || boardComplete) {
            return false;
        }

        const scope = pokerBoardStore.scope;
        return (
            scope.kind === "player" &&
            scope.playerIndex === this.playerIndex &&
            scope.cardIndex === cardIndex
        );
    }

    /**
     * Handle card placeholder click
     */
    handleCardClick(cardIndex: 0 | 1) {
        const playerCards = pokerBoardStore.players[this.playerIndex] || [
            null,
            null,
        ];
        const currentCard = playerCards[cardIndex];
        const scope = {
            kind: "player" as const,
            playerIndex: this.playerIndex,
            cardIndex,
        };

        // If card is already selected, clear it
        if (currentCard !== null) {
            pokerBoardStore.setScope(scope);
            pokerBoardStore.clearCard(scope);
            deckStore.markCardAsUnselected(currentCard);
            pokerBoardStore.closePicker();
        } else {
            // If card is empty, open picker
            pokerBoardStore.setScope(scope);
            pokerBoardStore.openPicker();
        }
    }

    /**
     * Render a single card (or placeholder)
     */
    renderCard(card: Card | null, cardIndex: 0 | 1): TemplateResult {
        const isInScope = this.isCardInScope(cardIndex);
        const isEmpty = card === null;

        if (isEmpty) {
            return html`
                <div
                    class="card-placeholder ${isInScope ? "in-scope" : ""}"
                    @click=${() => this.handleCardClick(cardIndex)}
                >
                    <div class="placeholder-content">
                        <span class="placeholder-icon">${plusIcon}</span>
                    </div>
                </div>
            `;
        }

        const suitData = SUITS.find((s) => s.suit === card.suit);
        const rankData = RANKS.find((r) => r.rank === card.rank);

        return html`
            <div
                class="card-display ${isInScope ? "in-scope" : ""}"
                @click=${() => this.handleCardClick(cardIndex)}
            >
                <div class="card-content">
                    <span class="card-rank"
                        >${rankData?.label || card.rank}</span
                    >
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
        // Access the entire players array first to ensure MobX tracks it
        // Then access the specific player index - MobX will track both
        const players = pokerBoardStore.players;
        const playerIndex = this.playerIndex;
        // Access the array element directly - MobX tracks observable array access
        const playerCards = players[playerIndex] || [null, null];

        // Get equity for this player
        const winEquity = pokerBoardStore.getPlayerEquity(playerIndex);
        const tieEquity = pokerBoardStore.getPlayerTieEquity(playerIndex);
        const hasEquity = winEquity !== null;
        const isValidBoardState = pokerBoardStore.isValidBoardState();
        // Show tie if it's non-trivial (> 0.1%)
        const showTie = tieEquity !== null && tieEquity > 0.1;

        // Check if this player is a winner
        const isWinner = pokerBoardStore.isPlayerWinner(playerIndex);

        // Check if this player is the dealer
        const isDealer = pokerBoardStore.dealerIndex === playerIndex;
        const dealerSelectionMode = pokerBoardStore.dealerSelectionMode;

        return html`
            <div class="player-wrapper ${isWinner ? "winner" : ""}">
                ${isWinner
                    ? html` <div class="crown-overlay">${crownIcon}</div> `
                    : null}
                ${isDealer
                    ? html`
                          <div
                              class="dealer-overlay ${dealerSelectionMode
                                  ? "selectable"
                                  : ""}"
                              @click=${(e: Event) => {
                                  e.stopPropagation();
                                  pokerBoardStore.toggleDealerSelectionMode();
                              }}
                          >
                              ${dealerIcon}
                          </div>
                      `
                    : null}
                ${dealerSelectionMode
                    ? html`
                          <div
                              class="dealer-selection-circle"
                              @click=${(e: Event) => {
                                  e.stopPropagation();
                                  pokerBoardStore.setDealer(playerIndex);
                              }}
                          ></div>
                      `
                    : null}
                <div class="player-container">
                    <div class="player-label">
                        Player ${this.playerIndex + 1}
                    </div>
                    <div class="player-cards">
                        ${this.renderCard(playerCards[0], 0)}
                        ${this.renderCard(playerCards[1], 1)}
                    </div>
                    ${hasEquity && isValidBoardState
                        ? html`
                              <div class="player-equity">
                                  <div class="equity-win">
                                      Win: ${winEquity}%
                                  </div>
                                  ${showTie
                                      ? html`
                                            <div class="equity-tie">
                                                Tie: ${tieEquity.toFixed(1)}%
                                            </div>
                                        `
                                      : null}
                              </div>
                          `
                        : null}
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [Player.TAG_NAME]: Player;
    }
}
