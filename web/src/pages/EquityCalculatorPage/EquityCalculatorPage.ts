import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";
import { pokerBoardStore } from "../../stores/index";
import "../../components/OutsDisplay";
import "../../components/PokerTable";
import "../../components/CardPickerModal";

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

    /**
     * Check if outs display should be shown
     * Only show when there are exactly 4 board cards (turn) and 2 active players with complete hands
     */
    shouldShowOuts(): boolean {
        const activePlayersWithHands =
            pokerBoardStore.getActivePlayersWithCompleteHands();
        const boardCards = pokerBoardStore.getBoardCards();
        return activePlayersWithHands.length === 2 && boardCards.length === 4;
    }

    render() {
        const showOuts = this.shouldShowOuts();

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
                        <card-picker-modal></card-picker-modal>
                        <!-- Outs Display below the board - only show when necessary -->
                        ${showOuts
                            ? html`
                                  <div class="outs-display-container">
                                      <outs-display></outs-display>
                                  </div>
                              `
                            : null}
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
