import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { handBuilderStore, ActionType } from "../../stores/index";
import { closeIcon } from "../../assets/index";

@customElement("hand-builder-tray")
export class HandBuilderTray extends MobxLitElement {
    static readonly TAG_NAME = "hand-builder-tray";

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
        const canCheck = currentBet === 0 || contributed >= currentBet;
        const canCall = currentBet > 0 && contributed < currentBet;
        const canBet = currentBet === 0;
        const canRaise = currentBet > 0;

        const actions: Array<{
            type: ActionType;
            label: string;
            requiresAmount?: boolean;
        }> = [];

        // Always available
        actions.push({ type: "FOLD", label: "Fold" });

        // Conditional actions
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
        } = handBuilderStore;

        const player = currentActingPlayer;
        const needsAmount =
            currentActionType === "BET" || currentActionType === "RAISE";

        return html`
            <div class="tray-container">
                <sp-action-button
                    class="close-button"
                    @click=${() =>
                        handBuilderStore.setHandBuilderTrayOpen(false)}
                    quiet
                    title="Close hand builder"
                    size="s"
                >
                    <span slot="icon" class="close-icon">${closeIcon}</span>
                </sp-action-button>

                <div class="street-info">
                    Street: ${current_street} | Current Bet: ${current_bet}
                </div>

                ${player
                    ? html`
                          <div class="current-player">
                              <div class="current-player-label">
                                  Current Player
                              </div>
                              <div class="current-player-name">
                                  ${player.player_label} (Seat ${player.seat})
                              </div>
                              <div class="current-player-stats">
                                  Stack: ${player.starting_stack} | Contributed:
                                  ${player.contributed_this_street}
                              </div>
                          </div>
                      `
                    : html`<div>No active players</div>`}

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
                                        this.handleActionSelect(action.type)}
                                >
                                    ${action.label}
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
                                                      >Raise To (Total)</label
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
                                    @click=${() => this.handleTagToggle(tag)}
                                >
                                    ${tag}
                                </button>
                            `
                        )}
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Street Actions</div>
                    <div class="action-buttons">
                        ${current_street === "PREFLOP"
                            ? html`
                                  <button
                                      class="action-button"
                                      @click=${() => {
                                          handBuilderStore.advanceStreet();
                                          handBuilderStore.insertDealAction();
                                      }}
                                  >
                                      Deal Flop
                                  </button>
                              `
                            : current_street === "FLOP"
                              ? html`
                                    <button
                                        class="action-button"
                                        @click=${() => {
                                            handBuilderStore.advanceStreet();
                                            handBuilderStore.insertDealAction();
                                        }}
                                    >
                                        Deal Turn
                                    </button>
                                `
                              : current_street === "TURN"
                                ? html`
                                      <button
                                          class="action-button"
                                          @click=${() => {
                                              handBuilderStore.advanceStreet();
                                              handBuilderStore.insertDealAction();
                                          }}
                                      >
                                          Deal River
                                      </button>
                                  `
                                : null}
                    </div>
                </div>

                <div class="submit-section">
                    <button
                        class="submit-button"
                        ?disabled=${!currentActionType ||
                        (needsAmount &&
                            !currentActionAmount &&
                            !currentActionRaiseTo)}
                        @click=${this.handleSubmit}
                    >
                        Add Action & Next Player
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
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [HandBuilderTray.TAG_NAME]: HandBuilderTray;
    }
}
