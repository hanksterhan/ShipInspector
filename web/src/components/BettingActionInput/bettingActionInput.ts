import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { replayStore } from "../../stores/index";
import { BettingActionType, BettingAction } from "@common/interfaces";

@customElement("betting-action-input")
export class BettingActionInput extends MobxLitElement {
    static readonly TAG_NAME = "betting-action-input";
    static get styles() {
        return styles;
    }

    private selectedPlayerIndex: number = 0;
    private selectedAction: BettingActionType = "fold";
    private amount: number = 0;

    handlePlayerChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        this.selectedPlayerIndex = parseInt(target.value) || 0;
    }

    handleActionChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        this.selectedAction = target.value as BettingActionType;
    }

    handleAmountChange(e: Event) {
        const target = e.target as HTMLInputElement;
        this.amount = parseFloat(target.value) || 0;
    }

    handleAddAction() {
        if (!replayStore.currentReplay) return;

        const action: BettingAction = {
            playerIndex: this.selectedPlayerIndex,
            action: this.selectedAction,
        };

        if (
            this.selectedAction === "bet" ||
            this.selectedAction === "raise" ||
            this.selectedAction === "all-in"
        ) {
            action.amount = this.amount;
        }

        replayStore.addStreetAction(action);
        this.requestUpdate();
    }

    render() {
        if (!replayStore.currentReplay) {
            return html``;
        }

        const activePlayers = replayStore.getActivePlayers();
        if (activePlayers.length === 0) {
            return html`
                <div class="action-input-container">
                    <p>Please add players to the hand first.</p>
                </div>
            `;
        }
        const actionTypes: BettingActionType[] = [
            "fold",
            "check",
            "call",
            "bet",
            "raise",
            "all-in",
        ];
        const needsAmount =
            this.selectedAction === "bet" ||
            this.selectedAction === "raise" ||
            this.selectedAction === "all-in";

        return html`
            <div class="action-input-container">
                <h4>Add Betting Action</h4>
                <div class="action-form">
                    <div class="form-group">
                        <label for="player-select">Player:</label>
                        <select
                            id="player-select"
                            .value=${this.selectedPlayerIndex.toString()}
                            @change=${this.handlePlayerChange}
                        >
                            ${activePlayers.map(
                                (player) => html`
                                    <option value=${player.index}>
                                        Player ${player.index + 1}
                                        ${player.name ? `(${player.name})` : ""}
                                    </option>
                                `
                            )}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="action-select">Action:</label>
                        <select
                            id="action-select"
                            .value=${this.selectedAction}
                            @change=${this.handleActionChange}
                        >
                            ${actionTypes.map(
                                (action) => html`
                                    <option value=${action}>
                                        ${action.charAt(0).toUpperCase() +
                                        action.slice(1)}
                                    </option>
                                `
                            )}
                        </select>
                    </div>
                    ${needsAmount
                        ? html`
                              <div class="form-group">
                                  <label for="amount-input">Amount:</label>
                                  <input
                                      type="number"
                                      id="amount-input"
                                      min="0"
                                      step="0.5"
                                      .value=${this.amount.toString()}
                                      @change=${this.handleAmountChange}
                                  />
                              </div>
                          `
                        : ""}
                    <button @click=${this.handleAddAction}>Add Action</button>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [BettingActionInput.TAG_NAME]: BettingActionInput;
    }
}

