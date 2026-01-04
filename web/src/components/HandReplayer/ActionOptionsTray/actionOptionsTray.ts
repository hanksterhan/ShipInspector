import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { handBuilderStore, ActionType } from "../../../stores/index";
import {
    minimizeIcon,
    arrowRightIcon,
    arrowUpIcon,
} from "../../../assets/index";

@customElement("action-options-tray")
export class ActionOptionsTray extends MobxLitElement {
    static readonly TAG_NAME = "action-options-tray";

    static get styles() {
        return styles;
    }

    get availableTags(): string[] {
        return [
            "tanked",
            "snap",
            "all_in",
            "showed_1",
            "showed_2",
            "mucked",
            "table_talk",
            "misclick",
        ];
    }

    get availableActions(): Array<{
        type: ActionType;
        label: string;
        requiresAmount?: boolean;
    }> {
        const player = handBuilderStore.currentActingPlayer;
        if (!player) return [];

        const currentBet = handBuilderStore.current_bet;
        const contributed = player.contributed_this_street;
        const isFacingBet = handBuilderStore.isFacingBet;
        const canCheck =
            !isFacingBet && (currentBet === 0 || contributed >= currentBet);
        const canCall = isFacingBet;
        const canBet = currentBet === 0;
        const canRaise = currentBet > 0;

        const actions: Array<{
            type: ActionType;
            label: string;
            requiresAmount?: boolean;
        }> = [];

        // Always available
        actions.push({ type: "FOLD", label: "Fold" });

        // Conditional actions - show CALL instead of CHECK when facing a bet
        if (canCheck) {
            actions.push({ type: "CHECK", label: "Check" });
        }
        if (canCall) {
            const callAmount = currentBet - contributed;
            actions.push({ type: "CALL", label: `Call ${callAmount}` });
        }
        if (canBet) {
            actions.push({ type: "BET", label: "Bet", requiresAmount: true });
        }
        if (canRaise) {
            actions.push({
                type: "RAISE",
                label: "Raise",
                requiresAmount: true,
            });
        }

        // Always available
        actions.push({ type: "ALL_IN", label: "All In" });

        return actions;
    }

    handleActionSelect(type: ActionType) {
        handBuilderStore.setCurrentActionType(type);
    }

    handleAmountChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const value = target.value ? parseInt(target.value, 10) : null;
        handBuilderStore.setCurrentActionAmount(value);
    }

    handleRaiseToChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const value = target.value ? parseInt(target.value, 10) : null;
        handBuilderStore.setCurrentActionRaiseTo(value);
    }

    handleTagToggle(tag: string) {
        handBuilderStore.toggleCurrentActionTag(tag);
    }

    handleSubmit() {
        handBuilderStore.submitCurrentAction();
    }

    render() {
        const {
            currentActionType,
            currentActionAmount,
            currentActionRaiseTo,
            currentActionTags,
            currentActingPlayer,
            current_street,
            current_bet,
            handBuilderTrayMinimized,
        } = handBuilderStore;

        const player = currentActingPlayer;
        const needsAmount =
            currentActionType === "BET" || currentActionType === "RAISE";

        return html`
            <div
                class="tray-container ${handBuilderTrayMinimized
                    ? "minimized"
                    : ""}"
            >
                <button
                    class="expand-tab ${handBuilderTrayMinimized
                        ? "visible"
                        : "hidden"}"
                    @click=${() =>
                        handBuilderStore.setHandBuilderTrayMinimized(false)}
                    title="Expand hand builder"
                >
                    <span class="expand-text">Betting Options</span>
                    <span class="expand-icon">${arrowUpIcon}</span>
                </button>

                <div
                    class="tray-content ${handBuilderTrayMinimized
                        ? "hidden"
                        : "visible"}"
                >
                    <sp-action-button
                        class="minimize-button"
                        @click=${() =>
                            handBuilderStore.setHandBuilderTrayMinimized(true)}
                        quiet
                        title="Minimize hand builder"
                        size="s"
                    >
                        <span slot="icon" class="minimize-icon"
                            >${minimizeIcon}</span
                        >
                    </sp-action-button>

                    <div class="street-info">
                        Street: ${current_street} | Current Bet: ${current_bet}
                        ${handBuilderStore.isBettingRoundComplete
                            ? " | Betting Round Complete"
                            : ""}
                    </div>

                    <div class="section">
                        <div class="section-title">Select Action</div>
                        <div class="action-buttons">
                            ${this.availableActions.map(
                                (action) => html`
                                    <button
                                        class="action-button ${currentActionType ===
                                        action.type
                                            ? "selected"
                                            : ""}"
                                        @click=${() =>
                                            this.handleActionSelect(
                                                action.type
                                            )}
                                    >
                                        ${action.label}
                                    </button>
                                `
                            )}
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Tags (Optional)</div>
                        <div class="tags-section">
                            ${this.availableTags.map(
                                (tag) => html`
                                    <button
                                        class="tag-button ${currentActionTags.includes(
                                            tag
                                        )
                                            ? "selected"
                                            : ""}"
                                        @click=${() =>
                                            this.handleTagToggle(tag)}
                                    >
                                        ${tag}
                                    </button>
                                `
                            )}
                        </div>
                    </div>

                    ${needsAmount && currentActionType
                        ? html`
                              <div class="section">
                                  <div class="section-title">Bet Size</div>
                                  <div class="bet-inputs">
                                      ${currentActionType === "BET"
                                          ? html`
                                                <div class="input-group">
                                                    <label>Bet Amount</label>
                                                    <input
                                                        type="number"
                                                        .value=${currentActionAmount?.toString() ??
                                                        ""}
                                                        @input=${this
                                                            .handleAmountChange}
                                                        placeholder="Enter bet size"
                                                        min="0"
                                                    />
                                                </div>
                                            `
                                          : currentActionType === "RAISE"
                                            ? html`
                                                  <div class="input-group">
                                                      <label
                                                          >Raise To
                                                          (Total)</label
                                                      >
                                                      <input
                                                          type="number"
                                                          .value=${currentActionRaiseTo?.toString() ??
                                                          ""}
                                                          @input=${this
                                                              .handleRaiseToChange}
                                                          placeholder="Enter total raise size"
                                                          min=${current_bet + 1}
                                                      />
                                                  </div>
                                              `
                                            : null}
                                  </div>
                              </div>
                          `
                        : null}

                    <div class="submit-section">
                        ${player
                            ? html`
                                  <div class="current-player">
                                      <div class="current-player-label">
                                          Current Player
                                      </div>
                                      <div class="current-player-name">
                                          ${player.player_label} (Seat
                                          ${player.seat})
                                      </div>
                                      <div class="current-player-stats">
                                          Stack: ${player.starting_stack} |
                                          Contributed:
                                          ${player.contributed_this_street}
                                      </div>
                                  </div>
                              `
                            : html`<div class="current-player">
                                  No active players
                              </div>`}
                        <button
                            class="submit-button"
                            ?disabled=${!currentActionType ||
                            (needsAmount &&
                                !currentActionAmount &&
                                !currentActionRaiseTo)}
                            @click=${this.handleSubmit}
                            title="Add Action & Next Player"
                        >
                            <span class="submit-icon">${arrowRightIcon}</span>
                        </button>
                    </div>

                    ${handBuilderStore.actionDrafts.length > 0
                        ? html`
                              <div class="section">
                                  <div class="section-title">
                                      Action Timeline
                                      (${handBuilderStore.actionDrafts.length})
                                  </div>
                                  <div class="action-timeline">
                                      ${handBuilderStore.actionDrafts.map(
                                          (action, idx) => html`
                                              <div class="action-timeline-item">
                                                  ${idx + 1}. ${action.street}:
                                                  ${action.type}
                                                  ${action.actor_seat
                                                      ? ` (Seat ${action.actor_seat})`
                                                      : ""}
                                                  ${action.amount
                                                      ? ` ${action.amount}`
                                                      : ""}
                                                  ${action.raise_to
                                                      ? ` (to ${action.raise_to})`
                                                      : ""}
                                                  ${action.tags.length > 0
                                                      ? ` [${action.tags.join(", ")}]`
                                                      : ""}
                                              </div>
                                          `
                                      )}
                                  </div>
                              </div>
                          `
                        : null}
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [ActionOptionsTray.TAG_NAME]: ActionOptionsTray;
    }
}
