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

    @property({ type: String })
    mode?: "mc" | "exact";

    @property({ type: String })
    label?: string;

    connectedCallback() {
        super.connectedCallback();
        // Reaction is now handled centrally in EquityStore to prevent duplicate calls
        // Even if multiple EquityDisplay components exist (one per player), only one reaction triggers calculations
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    render(): TemplateResult {
        // Determine which result to use based on mode
        const result =
            this.mode === "mc"
                ? equityStore.equityResultMC
                : this.mode === "exact"
                  ? equityStore.equityResultExact
                  : equityStore.equityResult;

        const isLoading =
            this.mode === "mc"
                ? equityStore.isLoadingMC
                : this.mode === "exact"
                  ? equityStore.isLoadingExact
                  : equityStore.isLoading;

        const error =
            this.mode === "mc"
                ? equityStore.errorMC
                : this.mode === "exact"
                  ? equityStore.errorExact
                  : equityStore.error;

        // Show loading state
        if (isLoading) {
            return html`
                <div class="equity-display loading">
                    ${this.label
                        ? html`<div class="equity-label">${this.label}</div>`
                        : ""}
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
                    ${this.label
                        ? html`<div class="equity-label">${this.label}</div>`
                        : ""}
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
                        ${this.label
                            ? html`<div class="equity-label">${this.label}</div>`
                            : ""}
                        <span class="empty-text"
                            >Select at least 2 player hands</span
                        >
                    </div>
                `;
            }

            return html`
                <div class="equity-display empty">
                    ${this.label
                        ? html`<div class="equity-label">${this.label}</div>`
                        : ""}
                    <span class="empty-text">No equity data</span>
                </div>
            `;
        }

        // Check if player index is valid
        const { win, tie, samples } = result;
        if (this.playerIndex < 0 || this.playerIndex >= win.length) {
            return html`
                <div class="equity-display empty">
                    ${this.label
                        ? html`<div class="equity-label">${this.label}</div>`
                        : ""}
                    <span class="empty-text">Invalid player index</span>
                </div>
            `;
        }

        // Display equity for this specific player
        const winPercentage = (win[this.playerIndex] * 100).toFixed(2);
        const tiePercentage = (tie[this.playerIndex] * 100).toFixed(2);
        // Only show tie if it's 0.01% or more
        const hasTie = parseFloat(tiePercentage) >= 0.01;

        // Get calculation time based on mode
        const calculationTime =
            this.mode === "mc"
                ? equityStore.calculationTimeMC
                : this.mode === "exact"
                  ? equityStore.calculationTimeExact
                  : null;

        // Format time as seconds (e.g., "4s" or "0.5s")
        const formatTime = (ms: number | null): string => {
            if (ms === null) return "";
            const seconds = ms / 1000;
            if (seconds < 1) {
                return `${seconds.toFixed(1)}s`;
            }
            // Show whole number if it's a whole number, otherwise 1 decimal place
            const rounded = Math.round(seconds * 10) / 10;
            if (rounded % 1 === 0) {
                return `${Math.round(seconds)}s`;
            }
            return `${rounded.toFixed(1)}s`;
        };

        // Format samples with truncation
        // >= 1,000,000: show as millions (e.g., 1,234,567 → 1.23M)
        // >= 100,000: show rounded to nearest 10k in 10k units (e.g., 842,000 → 84k)
        // >= 10,000: show rounded to nearest 10k in thousands (e.g., 50,000 → 50k)
        // < 10,000: show as-is (e.g., 9321 → 9321)
        const formatSamples = (count: number): string => {
            if (count >= 1_000_000) {
                const millions = count / 1_000_000;
                return `${millions.toFixed(2)}M`;
            } else if (count >= 100_000) {
                // Round to nearest 10,000, then show in 10k units
                const rounded = Math.round(count / 10_000) * 10_000;
                const tenThousands = rounded / 10_000;
                return `${tenThousands}k`;
            } else if (count >= 10_000) {
                // Round to nearest 10,000, then show in thousands
                const rounded = Math.round(count / 10_000) * 10_000;
                const thousands = rounded / 1_000;
                return `${thousands}k`;
            } else {
                return count.toLocaleString();
            }
        };

        const timeText = formatTime(calculationTime);
        const samplesText = formatSamples(samples);

        return html`
            <div class="equity-display">
                ${this.label
                    ? html`<div class="equity-label">${this.label}</div>`
                    : ""}
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
                <div class="equity-footer">
                    <span class="samples-text"
                        >Samples: ${samplesText}</span
                    >
                    ${timeText
                        ? html`<span class="time-text">${timeText}</span>`
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
