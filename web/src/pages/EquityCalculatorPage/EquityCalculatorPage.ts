import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";

/**
 * EquityCalculatorPage - Dedicated equity calculation page
 *
 * This page provides a focused interface for calculating poker hand equity.
 * Currently displays the poker table component for equity calculations.
 */
@customElement("equity-calculator-page")
export class EquityCalculatorPage extends MobxLitElement {
    static readonly TAG_NAME = "equity-calculator-page";
    static get styles() {
        return styles;
    }

    render() {
        return html`
            <div class="page-wrapper">
                <div class="page-container">
                    <div class="page-header">
                        <h1>Equity Calculator</h1>
                        <p>
                            Calculate win probabilities for Texas Hold'em hands.
                        </p>
                    </div>
                    <div class="page-content">
                        <poker-table></poker-table>
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [EquityCalculatorPage.TAG_NAME]: EquityCalculatorPage;
    }
}
