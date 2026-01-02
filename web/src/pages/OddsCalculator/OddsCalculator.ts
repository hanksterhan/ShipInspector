import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";

/**
 * Odds Calculator page
 */
@customElement("odds-calculator")
export class OddsCalculator extends MobxLitElement {
    static readonly TAG_NAME = "odds-calculator";
    static get styles() {
        return styles;
    }

    render() {
        return html`
            <div class="odds-calculator-wrapper">
                <div class="odds-calculator-container">
                    <div class="odds-calculator-content">
                        <h2>Odds Calculator</h2>
                        <p>Odds calculator functionality coming soon...</p>
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [OddsCalculator.TAG_NAME]: OddsCalculator;
    }
}
