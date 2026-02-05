import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, state } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import type { ActionType, Card, Street } from "@common/interfaces";
import { handRecorderStore, deckStore } from "../../stores";
import "../CardSelector";
import type { CardSelectionTarget } from "../CardSelector/cardSelector";

const STREET_LABELS: Record<Street, string> = {
    preflop: "Pre-Flop",
    flop: "Flop",
    turn: "Turn",
    river: "River",
};

const ACTION_BUTTONS: Array<{ type: ActionType; label: string }> = [
    { type: "FOLD", label: "Fold" },
    { type: "CHECK", label: "Check" },
    { type: "CALL", label: "Call" },
    { type: "BET", label: "Bet" },
    { type: "RAISE", label: "Raise" },
    { type: "ALL_IN", label: "All-In" },
];

@customElement("action-recorder")
export class ActionRecorder extends MobxLitElement {
    static readonly TAG_NAME = "action-recorder";
    static get styles() {
        return styles;
    }

    @state()
    private selectedActorSeat: number | null = null;

    @state()
    private selectedActionType: ActionType | null = null;

    @state()
    private amountInput: string = "";

    @state()
    private raiseToInput: string = "";

    @state()
    private editingIndex: number | null = null;

    @state()
    private selectedBoardIndex: number | null = null;

    @state()
    private errorMessage: string | null = null;

    private getBoardIndexesForStreet(street: Street): number[] {
        switch (street) {
            case "flop":
                return [0, 1, 2];
            case "turn":
                return [3];
            case "river":
                return [4];
            default:
                return [];
        }
    }

    private getDefaultBoardIndex(street: Street): number | null {
        const indexes = this.getBoardIndexesForStreet(street);
        return indexes.length > 0 ? indexes[0] : null;
    }

    private getNextBoardIndex(
        currentIndex: number,
        street: Street
    ): number | null {
        const indexes = this.getBoardIndexesForStreet(street);
        const nextIndex = indexes.indexOf(currentIndex) + 1;
        return indexes[nextIndex] ?? null;
    }

    private handleStreetChange(street: Street) {
        handRecorderStore.setStreet(street);
        this.selectedBoardIndex = this.getDefaultBoardIndex(street);
    }

    private handleActorSelection(event: CustomEvent) {
        const target = event.target as any;
        const selectedValue = Array.isArray(target.selected)
            ? target.selected[0]
            : target.selected;
        this.selectedActorSeat =
            selectedValue !== undefined && selectedValue !== null
                ? Number(selectedValue)
                : null;
    }

    private parseNumber(value: string): number | null {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    private resetActionInputs() {
        this.selectedActionType = null;
        this.amountInput = "";
        this.raiseToInput = "";
        this.errorMessage = null;
    }

    private startEdit(index: number) {
        const action = handRecorderStore.actions[index];
        this.editingIndex = index;
        this.selectedActionType = action.actionType;
        this.selectedActorSeat = action.actorSeat ?? null;
        this.amountInput = action.amount?.toString() ?? "";
        this.raiseToInput = action.raiseTo?.toString() ?? "";
        this.errorMessage = null;
        this.handleStreetChange(action.street);
    }

    private cancelEdit() {
        this.editingIndex = null;
        this.resetActionInputs();
    }

    private handleRemoveAction(index: number) {
        if (this.editingIndex !== null) {
            if (this.editingIndex === index) {
                this.cancelEdit();
            } else if (this.editingIndex > index) {
                this.editingIndex -= 1;
            }
        }
        handRecorderStore.removeAction(index);
    }

    private validateActionInputs(actionType: ActionType): {
        amount: number | null;
        raiseTo: number | null;
    } | null {
        if (this.selectedActorSeat === null) {
            this.errorMessage = "Select a player before adding an action.";
            return null;
        }

        const amountValue = this.parseNumber(this.amountInput);
        const raiseToValue = this.parseNumber(this.raiseToInput);
        const resolvedAmount =
            amountValue ??
            (actionType === "RAISE" ? null : (raiseToValue ?? null));
        const resolvedRaiseTo =
            actionType === "RAISE" ? (raiseToValue ?? amountValue) : null;
        const requiresAmount = ["CALL", "BET", "RAISE", "ALL_IN"].includes(
            actionType
        );

        if (requiresAmount && resolvedAmount === null) {
            this.errorMessage = "Enter an amount before recording this action.";
            return null;
        }

        return {
            amount: resolvedAmount,
            raiseTo: resolvedRaiseTo,
        };
    }

    private handleActionClick(actionType: ActionType) {
        this.selectedActionType = actionType;

        if (this.editingIndex !== null) {
            return;
        }

        const values = this.validateActionInputs(actionType);
        if (!values) {
            return;
        }

        handRecorderStore.addAction({
            street: handRecorderStore.currentStreet,
            actionType,
            actorSeat: this.selectedActorSeat,
            amount: values.amount,
            raiseTo: values.raiseTo,
            decisionMs: null,
            tags: [],
        });
        this.resetActionInputs();
    }

    private saveEdit() {
        if (this.editingIndex === null || !this.selectedActionType) {
            return;
        }

        const values = this.validateActionInputs(this.selectedActionType);
        if (!values) {
            return;
        }

        handRecorderStore.updateAction(this.editingIndex, {
            street: handRecorderStore.currentStreet,
            actionType: this.selectedActionType,
            actorSeat: this.selectedActorSeat,
            amount: values.amount,
            raiseTo: values.raiseTo,
        });
        this.editingIndex = null;
        this.resetActionInputs();
    }

    private getPlayerLabel(seatIndex: number | null): string {
        if (seatIndex === null) {
            return "Dealer";
        }
        const player = handRecorderStore.players.find(
            (candidate) => candidate.seatIndex === seatIndex
        );
        return player
            ? `${player.displayName} (Seat ${player.seatIndex})`
            : `Seat ${seatIndex}`;
    }

    private formatCard(card: Card | null): string {
        if (!card) {
            return "--";
        }
        const rankLabel =
            card.rank === 14
                ? "A"
                : card.rank === 13
                  ? "K"
                  : card.rank === 12
                    ? "Q"
                    : card.rank === 11
                      ? "J"
                      : card.rank.toString();
        return `${rankLabel}${card.suit.toUpperCase()}`;
    }

    private handleBoardSlotClick(index: number) {
        const boardCard = handRecorderStore.gameSettings.board[index];
        if (boardCard) {
            deckStore.markCardAsUnselected(boardCard);
            handRecorderStore.setBoardCard(index, null);
        }
        this.selectedBoardIndex = index;
    }

    private getCardSelectionTarget(): CardSelectionTarget {
        return {
            isCardUsed: (card: Card) => handRecorderStore.isCardUsed(card),
            setCard: (card: Card) => {
                if (this.selectedBoardIndex === null) {
                    return false;
                }
                handRecorderStore.setBoardCard(this.selectedBoardIndex, card);
                const nextIndex = this.getNextBoardIndex(
                    this.selectedBoardIndex,
                    handRecorderStore.currentStreet
                );
                this.selectedBoardIndex = nextIndex ?? this.selectedBoardIndex;
                return true;
            },
        };
    }

    private renderBoardSelector() {
        const { currentStreet, gameSettings } = handRecorderStore;
        const boardIndexes = this.getBoardIndexesForStreet(currentStreet);

        if (boardIndexes.length === 0) {
            return null;
        }

        return html`
            <div class="board-selector">
                <div class="board-slots">
                    ${boardIndexes.map((index) => {
                        const card = gameSettings.board[index];
                        const isSelected = this.selectedBoardIndex === index;
                        return html`
                            <sp-action-button
                                class="board-slot ${isSelected
                                    ? "selected"
                                    : ""}"
                                @click=${() => this.handleBoardSlotClick(index)}
                            >
                                ${this.formatCard(card)}
                            </sp-action-button>
                        `;
                    })}
                </div>
                ${currentStreet === "flop"
                    ? html`<div class="board-hint">
                          Select three flop cards.
                      </div>`
                    : null}
                <card-selector
                    .selectionTarget=${this.getCardSelectionTarget()}
                    .closeOnSelect=${false}
                ></card-selector>
            </div>
        `;
    }

    private renderActionHistory() {
        if (handRecorderStore.actions.length === 0) {
            return html`<div class="history-empty">
                No actions recorded yet.
            </div>`;
        }

        return html`
            <div class="history-list">
                ${handRecorderStore.actions.map(
                    (action, index) => html`
                        <div class="history-row">
                            <div class="history-main">
                                <div class="history-index">#${index + 1}</div>
                                <div class="history-details">
                                    <div class="history-line">
                                        ${STREET_LABELS[action.street]} ·
                                        ${this.getPlayerLabel(action.actorSeat)}
                                        · ${action.actionType}
                                    </div>
                                    <div class="history-line history-amount">
                                        ${action.amount !== null
                                            ? `Amount: ${action.amount}`
                                            : "Amount: --"}
                                        ${action.raiseTo !== null
                                            ? ` · Raise to: ${action.raiseTo}`
                                            : ""}
                                    </div>
                                </div>
                            </div>
                            <div class="history-actions">
                                <sp-action-button
                                    class="edit-button"
                                    size="s"
                                    @click=${() => this.startEdit(index)}
                                >
                                    Edit
                                </sp-action-button>
                                <sp-action-button
                                    class="remove-button"
                                    size="s"
                                    @click=${() =>
                                        this.handleRemoveAction(index)}
                                >
                                    Remove
                                </sp-action-button>
                            </div>
                        </div>
                    `
                )}
            </div>
        `;
    }

    render() {
        const { currentStreet } = handRecorderStore;
        const activePlayers = handRecorderStore.players.filter(
            (player) => player.isActive
        );
        const selectedSeat =
            this.selectedActorSeat !== null
                ? [String(this.selectedActorSeat)]
                : [];

        return html`
            <section class="action-recorder">
                <div class="section-header">
                    <h3>Action Recorder</h3>
                    ${this.editingIndex !== null
                        ? html`<span class="edit-badge"
                              >Editing action #${this.editingIndex + 1}</span
                          >`
                        : null}
                </div>

                <div class="street-selector">
                    <sp-action-group
                        selects="single"
                        .selected=${[currentStreet]}
                        @change=${(event: CustomEvent) => {
                            const target = event.target as any;
                            const selectedValue = Array.isArray(target.selected)
                                ? target.selected[0]
                                : target.selected;
                            this.handleStreetChange(selectedValue as Street);
                        }}
                    >
                        ${Object.entries(STREET_LABELS).map(
                            ([street, label]) => html`
                                <sp-action-button value=${street}
                                    >${label}</sp-action-button
                                >
                            `
                        )}
                    </sp-action-group>
                </div>

                ${this.renderBoardSelector()}

                <div class="player-selector">
                    <sp-field-label>Player</sp-field-label>
                    <sp-action-group
                        selects="single"
                        .selected=${selectedSeat}
                        @change=${this.handleActorSelection}
                    >
                        ${activePlayers.map(
                            (player) => html`
                                <sp-action-button value=${player.seatIndex}>
                                    ${player.displayName || "Player"} (Seat
                                    ${player.seatIndex})
                                </sp-action-button>
                            `
                        )}
                    </sp-action-group>
                    ${activePlayers.length === 0
                        ? html`<div class="empty-state">
                              Add players to record actions.
                          </div>`
                        : null}
                </div>

                <div class="amount-row">
                    <label class="amount-label" for="action-amount"
                        >Amount</label
                    >
                    <input
                        id="action-amount"
                        type="number"
                        inputmode="decimal"
                        placeholder="0"
                        .value=${this.amountInput}
                        @input=${(event: InputEvent) => {
                            const target = event.target as HTMLInputElement;
                            this.amountInput = target.value;
                        }}
                    />
                    <label class="amount-label" for="action-raise-to"
                        >Raise to</label
                    >
                    <input
                        id="action-raise-to"
                        type="number"
                        inputmode="decimal"
                        placeholder="0"
                        .value=${this.raiseToInput}
                        @input=${(event: InputEvent) => {
                            const target = event.target as HTMLInputElement;
                            this.raiseToInput = target.value;
                        }}
                    />
                </div>

                <div class="action-buttons">
                    ${ACTION_BUTTONS.map(
                        (action) => html`
                            <sp-action-button
                                class="action-button"
                                ?selected=${this.selectedActionType ===
                                action.type}
                                @click=${() =>
                                    this.handleActionClick(action.type)}
                            >
                                ${action.label}
                            </sp-action-button>
                        `
                    )}
                </div>

                ${this.errorMessage
                    ? html`<div class="error-message">
                          ${this.errorMessage}
                      </div>`
                    : null}
                ${this.editingIndex !== null
                    ? html`
                          <div class="edit-actions">
                              <sp-action-button
                                  class="save-button"
                                  @click=${this.saveEdit}
                              >
                                  Save edit
                              </sp-action-button>
                              <sp-action-button
                                  class="cancel-button"
                                  @click=${this.cancelEdit}
                              >
                                  Cancel
                              </sp-action-button>
                          </div>
                      `
                    : null}

                <div class="action-history">
                    <h4>Action history</h4>
                    ${this.renderActionHistory()}
                </div>
            </section>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [ActionRecorder.TAG_NAME]: ActionRecorder;
    }
}
