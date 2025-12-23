import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";
import { replayStore } from "../../stores/index";

@customElement("poker-hands")
export class PokerHands extends MobxLitElement {
    static readonly TAG_NAME = "poker-hands";
    static get styles() {
        return styles;
    }

    async handleSave() {
        try {
            await replayStore.saveReplay();
            alert("Hand saved successfully!");
        } catch (error: any) {
            alert(`Failed to save: ${error.message}`);
        }
    }

    render() {
        return html`
            <div class="poker-hands-container">
                <h1>Poker Hand Replay</h1>
                ${replayStore.error
                    ? html`
                          <div class="error-message">
                              Error: ${replayStore.error}
                          </div>
                      `
                    : ""}
                <replay-configuration></replay-configuration>
                ${replayStore.currentReplay
                    ? html`
                          <div class="replay-content">
                              <player-management></player-management>
                              <player-cards-input></player-cards-input>
                              <street-viewer></street-viewer>
                              <betting-action-input></betting-action-input>
                              <div class="actions-bar">
                                  <button
                                      @click=${this.handleSave}
                                      ?disabled=${replayStore.isLoading}
                                  >
                                      ${replayStore.isLoading
                                          ? "Saving..."
                                          : "Save Hand"}
                                  </button>
                              </div>
                          </div>
                      `
                    : ""}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [PokerHands.TAG_NAME]: PokerHands;
    }
}
