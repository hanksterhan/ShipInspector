import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";
import { tableIcon } from "../../assets";
import { pokerBoardStore } from "../../stores/index";

/**
 * PokerHands page - Texas Hold'em board and equity calculator
 *
 * Features:
 * - Scope-based card selection with auto-advance
 * - Modal card picker with disabled cards
 * - Board with Flop/Turn/River labels
 * - Player hands with hole cards
 * - Real-time equity calculation
 * - Reset and clear functionality
 */
@customElement("poker-hands")
export class PokerHands extends MobxLitElement {
    static readonly TAG_NAME = "poker-hands";
    static get styles() {
        return styles;
    }

    render() {
        return html`
            <div class="poker-hands-wrapper">
                <div class="poker-hands-container">
                    <div class="poker-hands-content">
                        <div class="table-svg-container">
                            <div class="table-svg-background">${tableIcon}</div>
                            <div class="table-content-overlay">
                                <!-- Players at top edge -->
                                <div class="players-row">
                                    ${Array.from(
                                        {
                                            length: pokerBoardStore.players
                                                .length,
                                        },
                                        (_, i) => html`
                                            <poker-player
                                                .playerIndex=${i}
                                            ></poker-player>
                                        `
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Card Picker Modal -->
                ${pokerBoardStore.pickerOpen
                    ? html`
                          <div
                              class="picker-modal-overlay"
                              @click=${(e: Event) => {
                                  if (e.target === e.currentTarget) {
                                      pokerBoardStore.closePicker();
                                  }
                              }}
                          >
                              <div class="picker-modal-content">
                                  <div class="picker-modal-header">
                                      <h3>Select a Card</h3>
                                      <sp-action-button
                                          @click=${() =>
                                              pokerBoardStore.closePicker()}
                                          quiet
                                          title="Close"
                                      >
                                          ✕
                                      </sp-action-button>
                                  </div>
                                  <card-selector></card-selector>
                              </div>
                          </div>
                      `
                    : null}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [PokerHands.TAG_NAME]: PokerHands;
    }
}
