import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { tableIcon } from "../../assets";
import { pokerBoardStore } from "../../stores/index";
import "../../components/Player";
import "../../components/BoardCards";
import "../../components/AddPlayerButton";

/**
 * PokerTable component - Displays the poker table with players and board cards
 *
 * Calculates position for players around the elliptical table:
 * - Players 0-1: Top edge (side by side)
 * - Players 2-3: Right corners (top-right, bottom-right)
 * - Players 4-5: Bottom edge (side by side)
 * - Players 6-7: Left corners (bottom-left, top-left)
 */
@customElement("poker-table")
export class PokerTable extends MobxLitElement {
    static readonly TAG_NAME = "poker-table";
    static get styles() {
        return styles;
    }

    /**
     * Calculate position for a player around the elliptical table
     */
    getPlayerPosition(playerIndex: number): {
        top: string;
        left: string;
        transform: string;
    } {
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
                top = centerY - ellipseHeight - 4;
                left = centerX - 12; // Offset left from center
                break;
            case 1: // Top-right
                top = centerY - ellipseHeight - 4;
                left = centerX + 12; // Offset right from center
                break;
            // Right corners
            case 2: // Top-right corner
                top = centerY - ellipseHeight * 0.4 - 4;
                left = centerX + ellipseWidth - 2; // Moved left by 2%
                break;
            case 3: // Bottom-right corner
                top = centerY + ellipseHeight * 0.4 + 4;
                left = centerX + ellipseWidth - 2; // Moved left by 2%
                break;
            // Bottom edge - two players side by side
            case 4: // Bottom-right
                top = centerY + ellipseHeight + 2;
                left = centerX + 12; // Offset right from center
                break;
            case 5: // Bottom-left
                top = centerY + ellipseHeight + 2;
                left = centerX - 12; // Offset left from center
                break;
            // Left corners
            case 6: // Bottom-left corner
                top = centerY + ellipseHeight * 0.4 + 4;
                left = centerX - ellipseWidth;
                break;
            case 7: // Top-left corner
                top = centerY - ellipseHeight * 0.4 - 4;
                left = centerX - ellipseWidth;
                break;
            default:
                top = centerY;
                left = centerX;
        }

        return {
            top: `${top}%`,
            left: `${left}%`,
            transform: "translate(-50%, -50%)",
        };
    }

    private handleAddPlayerClick = (playerIndex: number) => {
        pokerBoardStore.addPlayer(playerIndex);
    };

    render() {
        // Access store properties to ensure MobX reactivity
        const players = pokerBoardStore.players;
        const playersLength = players.length;

        return html`
            <div class="table-svg-container">
                <div class="table-svg-background">${tableIcon}</div>
                <div class="table-content-overlay">
                    <!-- Players positioned around the table clockwise -->
                    ${Array.from(
                        {
                            length: playersLength,
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
                                              <add-player-button
                                                  .playerIndex=${i}
                                                  .onClick=${this
                                                      .handleAddPlayerClick}
                                              ></add-player-button>
                                          `}
                                </div>
                            `;
                        }
                    )}
                    <!-- Board cards in the center -->
                    <div class="board-cards-wrapper">
                        <board-cards></board-cards>
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [PokerTable.TAG_NAME]: PokerTable;
    }
}
