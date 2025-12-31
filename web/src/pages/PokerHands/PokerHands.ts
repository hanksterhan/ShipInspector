import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";
import { tableIcon } from "../../assets";

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
                            <div class="table-svg-wrapper">${tableIcon}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [PokerHands.TAG_NAME]: PokerHands;
    }
}
