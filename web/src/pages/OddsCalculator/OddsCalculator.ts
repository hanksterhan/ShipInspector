import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";
import { pokerBoardStore } from "../../stores/index";

/**
 * Odds Calculator page - Texas Hold'em board and equity calculator
 *
 * Features:
 * - Scope-based card selection with auto-advance
 * - Modal card picker with disabled cards
 * - Board with Flop/Turn/River labels
 * - Player hands with hole cards
 * - Real-time equity calculation
 * - Reset and clear functionality
 */
@customElement("odds-calculator")
export class OddsCalculator extends MobxLitElement {
    static readonly TAG_NAME = "odds-calculator";
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
            <div class="odds-calculator-wrapper">
                <div class="odds-calculator-container">
                    <div class="odds-calculator-content">
                        <poker-table></poker-table>
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

                <!-- Card Picker Modal -->
                <card-picker-modal
                    .isOpen=${pokerBoardStore.pickerOpen}
                ></card-picker-modal>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [OddsCalculator.TAG_NAME]: OddsCalculator;
    }
}
