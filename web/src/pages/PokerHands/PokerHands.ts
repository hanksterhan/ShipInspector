import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";
import { tableIcon, addPlayerIcon } from "../../assets";
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

    /**
     * Calculate position for a player around the elliptical table
     * Layout:
     * - Players 0-1: Top edge (side by side)
     * - Players 2-3: Right corners (top-right, bottom-right)
     * - Players 4-5: Bottom edge (side by side)
     * - Players 6-7: Left corners (bottom-left, top-left)
     */
    getPlayerPosition(playerIndex: number): { top: string; left: string; transform: string } {
        // Center position (50%, 50%)
        const centerX = 50;
        const centerY = 50;
        
        // Ellipse dimensions (percentages from center)
        const ellipseWidth = 45; // % from center horizontally
        const ellipseHeight = 35; // % from center vertically
        
        let top: number;
        let left: number;
        
        switch (playerIndex) {
            // Top edge - two players side by side
            case 0: // Top-left
                top = centerY - ellipseHeight;
                left = centerX - 12; // Offset left from center
                break;
            case 1: // Top-right
                top = centerY - ellipseHeight;
                left = centerX + 12; // Offset right from center
                break;
            // Right corners
            case 2: // Top-right corner
                top = centerY - ellipseHeight * 0.4;
                left = centerX + ellipseWidth - 2; // Moved left by 2%
                break;
            case 3: // Bottom-right corner
                top = centerY + ellipseHeight * 0.4;
                left = centerX + ellipseWidth - 2; // Moved left by 2%
                break;
            // Bottom edge - two players side by side
            case 4: // Bottom-right
                top = centerY + ellipseHeight;
                left = centerX + 12; // Offset right from center
                break;
            case 5: // Bottom-left
                top = centerY + ellipseHeight;
                left = centerX - 12; // Offset left from center
                break;
            // Left corners
            case 6: // Bottom-left corner
                top = centerY + ellipseHeight * 0.4;
                left = centerX - ellipseWidth;
                break;
            case 7: // Top-left corner
                top = centerY - ellipseHeight * 0.4;
                left = centerX - ellipseWidth;
                break;
            default:
                top = centerY;
                left = centerX;
        }
        
        return {
            top: `${top}%`,
            left: `${left}%`,
            transform: 'translate(-50%, -50%)',
        };
    }

    render() {
        return html`
            <div class="poker-hands-wrapper">
                <div class="poker-hands-container">
                    <div class="poker-hands-content">
                        <div class="table-svg-container">
                            <div class="table-svg-background">${tableIcon}</div>
                            <div class="table-content-overlay">
                                <!-- Players positioned around the table clockwise -->
                                ${Array.from(
                                    {
                                        length: pokerBoardStore.players.length,
                                    },
                                    (_, i) => {
                                        const position = this.getPlayerPosition(i);
                                        const isActive = pokerBoardStore.isPlayerActive(i);
                                        
                                        return html`
                                            <div
                                                class="player-position"
                                                style="top: ${position.top}; left: ${position.left}; transform: ${position.transform};"
                                            >
                                                ${isActive
                                                    ? html`
                                                          <poker-player
                                                              .playerIndex=${i}
                                                          ></poker-player>
                                                      `
                                                    : html`
                                                          <button
                                                              class="add-player-button"
                                                              @click=${() =>
                                                                  pokerBoardStore.addPlayer(
                                                                      i
                                                                  )}
                                                              title="Add Player ${i + 1}"
                                                          >
                                                          <span class="add-player-text"
                                                              >Add player</span
                                                          >
                                                              <span class="add-player-icon"
                                                                  >${addPlayerIcon}</span
                                                              >
                                                          </button>
                                                      `}
                                            </div>
                                        `;
                                    }
                                )}
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
