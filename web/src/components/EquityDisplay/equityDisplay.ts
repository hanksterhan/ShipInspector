import { html, TemplateResult } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { equityStore, cardStore } from "../../stores/index";

@customElement("equity-display")
export class EquityDisplay extends MobxLitElement {
    static readonly TAG_NAME = "equity-display";
    static get styles() {
        return styles;
    }

    @property({ type: Number })
    playerIndex: number = 0;

    connectedCallback() {
        super.connectedCallback();
        // Reaction is now handled centrally in EquityStore to prevent duplicate calls
        // Even if multiple EquityDisplay components exist (one per player), only one reaction triggers calculations
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    render(): TemplateResult {
        const result = equityStore.equityResult;
        const isLoading = equityStore.isLoading;
        const error = equityStore.error;

        // Show loading state
        if (isLoading) {
            return html`
                <div class="equity-display loading">
                    <sp-progress-circle
                        indeterminate
                        size="s"
                    ></sp-progress-circle>
                    <span class="loading-text">Calculating equity...</span>
                </div>
            `;
        }

        // Show error state
        if (error) {
            return html`
                <div class="equity-display error">
                    <span class="error-text">Error: ${error}</span>
                </div>
            `;
        }

        // Check if we have equity results
        if (!result) {
            const validHoles = cardStore.holeCards.filter(
                (hole) => hole !== undefined && hole !== null
            );

            if (validHoles.length < 2) {
                return html`
                    <div class="equity-display empty">
                        <span class="empty-text"
                            >Select at least 2 player hands</span
                        >
                    </div>
                `;
            }

            // If selecting partial flop (1-2 cards), show nothing
            const boardCardsCount = cardStore.boardCards.length;
            if (boardCardsCount === 1 || boardCardsCount === 2) {
                return html``;
            }

            return html`
                <div class="equity-display empty">
                    <span class="empty-text">No equity data</span>
                </div>
            `;
        }

        // Check if player index is valid
        const { win, tie } = result;
        if (this.playerIndex < 0 || this.playerIndex >= win.length) {
            return html`
                <div class="equity-display empty">
                    <span class="empty-text">Invalid player index</span>
                </div>
            `;
        }

        // Display equity for this specific player
        const winPercentage = (win[this.playerIndex] * 100).toFixed(2);
        const tiePercentage = (tie[this.playerIndex] * 100).toFixed(2);
        // Only show tie if it's 0.01% or more
        const hasTie = parseFloat(tiePercentage) >= 0.01;

        return html`
            <div class="equity-display">
                <div class="equity-stats">
                    <div class="equity-stat win">
                        <span class="stat-label">Win:</span>
                        <span class="stat-value">${winPercentage}%</span>
                    </div>
                    ${hasTie
                        ? html`
                              <div class="equity-stat tie">
                                  <span class="stat-label">Tie:</span>
                                  <span class="stat-value"
                                      >${tiePercentage}%</span
                                  >
                              </div>
                          `
                        : ""}
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [EquityDisplay.TAG_NAME]: EquityDisplay;
    }
}
