import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";
import { equityStore, cardStore } from "../../stores/index";

@customElement("equity-calculator")
export class EquityCalculator extends MobxLitElement {
    static readonly TAG_NAME = "equity-calculator";
    static get styles() {
        return styles;
    }

    renderEquityResults() {
        if (equityStore.isLoading) {
            return html`
                <div class="equity-results">
                    <p>Calculating equity...</p>
                </div>
            `;
        }

        if (equityStore.error) {
            return html`
                <div class="equity-results error">
                    <p>Error: ${equityStore.error}</p>
                </div>
            `;
        }

        if (!equityStore.equityResult) {
            return html`
                <div class="equity-results">
                    <p>Select at least 2 player hands to calculate equity</p>
                </div>
            `;
        }

        const { win, tie, lose, samples } = equityStore.equityResult;
        const validHoles = cardStore.holeCards.filter(
            (hole) => hole !== undefined && hole !== null
        );

        return html`
            <div class="equity-results">
                <h3>Equity Results</h3>
                <div class="equity-grid">
                    ${validHoles.map(
                        (hole, index) => html`
                            <div class="equity-player">
                                <div class="player-label">
                                    Player ${index + 1}
                                </div>
                                <div class="equity-stats">
                                    <div class="equity-stat">
                                        <span class="stat-label">Win:</span>
                                        <span class="stat-value win"
                                            >${(win[index] * 100).toFixed(
                                                2
                                            )}%</span
                                        >
                                    </div>
                                    <div class="equity-stat">
                                        <span class="stat-label">Tie:</span>
                                        <span class="stat-value tie"
                                            >${(tie[index] * 100).toFixed(
                                                2
                                            )}%</span
                                        >
                                    </div>
                                    <div class="equity-stat">
                                        <span class="stat-label">Lose:</span>
                                        <span class="stat-value lose"
                                            >${(lose[index] * 100).toFixed(
                                                2
                                            )}%</span
                                        >
                                    </div>
                                </div>
                            </div>
                        `
                    )}
                </div>
                <div class="equity-footer">
                    <p>Samples: ${samples.toLocaleString()}</p>
                </div>
            </div>
        `;
    }

    render() {
        return html`
            <h1>Equity Calculator</h1>
            <hole-selector></hole-selector>
            ${this.renderEquityResults()}
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [EquityCalculator.TAG_NAME]: EquityCalculator;
    }
}
