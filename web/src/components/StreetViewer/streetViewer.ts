import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { replayStore } from "../../stores/index";
import { Street } from "@common/interfaces";

@customElement("street-viewer")
export class StreetViewer extends MobxLitElement {
    static readonly TAG_NAME = "street-viewer";
    static get styles() {
        return styles;
    }

    handleStreetChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        replayStore.setActiveStreet(target.value as Street);
    }

    render() {
        if (!replayStore.currentReplay) {
            return html``;
        }

        const streetAction = replayStore.getCurrentStreetAction();
        const streets: Street[] = ["preflop", "flop", "turn", "river"];

        return html`
            <div class="street-container">
                <div class="street-selector">
                    <label for="street-select">Current Street:</label>
                    <select
                        id="street-select"
                        .value=${replayStore.activeStreet}
                        @change=${this.handleStreetChange}
                    >
                        ${streets.map(
                            (street) => html`
                                <option value=${street}>
                                    ${street.charAt(0).toUpperCase() +
                                    street.slice(1)}
                                </option>
                            `
                        )}
                    </select>
                </div>

                ${streetAction
                    ? html`
                          <div class="street-actions">
                              <h4>Actions:</h4>
                              ${streetAction.actions.length > 0
                                  ? html`
                                        <div class="actions-list">
                                            ${streetAction.actions.map(
                                                (action, idx) => html`
                                                    <div class="action-item">
                                                        Player ${action.playerIndex + 1}:
                                                        ${action.action}
                                                        ${action.amount
                                                            ? `($${action.amount})`
                                                            : ""}
                                                    </div>
                                                `
                                            )}
                                        </div>
                                    `
                                  : html`<p>No actions yet</p>`}
                          </div>
                      `
                    : html`<p>No actions for this street yet</p>`}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [StreetViewer.TAG_NAME]: StreetViewer;
    }
}

