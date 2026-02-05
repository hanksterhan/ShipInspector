import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, state } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import type { Card } from "@common/interfaces";
import type { CardSelectionTarget } from "../CardSelector/cardSelector";
import { deckStore, handRecorderStore, routerStore } from "../../stores";
import "../ActionRecorder";
import "../CardPickerModal";

type CardPickerContext =
    | { kind: "player"; seatIndex: number; cardIndex: 0 | 1 }
    | { kind: "board"; boardIndex: number };

@customElement("hand-recorder")
export class HandRecorder extends MobxLitElement {
    static readonly TAG_NAME = "hand-recorder";
    static get styles() {
        return styles;
    }

    @state()
    private isSaving = false;

    @state()
    private toastMessage: string | null = null;

    @state()
    private toastVariant: "success" | "error" = "success";

    @state()
    private isCardPickerOpen = false;

    @state()
    private cardPickerContext: CardPickerContext | null = null;

    private toastTimeoutId: number | null = null;

    private parseNumber(value: string): number | null {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    private handleTableSizeChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const nextValue = this.parseNumber(target.value);
        if (nextValue === null) {
            return;
        }
        const nextSize = Math.round(nextValue);
        const currentSize = handRecorderStore.gameSettings.tableSize;
        if (nextSize < currentSize) {
            handRecorderStore.players
                .filter((player) => player.seatIndex >= nextSize)
                .forEach((player) => {
                    player.showdownCards.forEach((card) => {
                        if (card) {
                            deckStore.markCardAsUnselected(card);
                        }
                    });
                });
        }
        handRecorderStore.setTableSize(nextSize);
        handRecorderStore.clearValidationErrors();
    }

    private handleButtonSeatChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const nextValue = this.parseNumber(target.value);
        if (nextValue === null) {
            return;
        }
        handRecorderStore.setButtonSeat(nextValue);
        handRecorderStore.clearValidationErrors();
    }

    private handleSettingChange(
        event: Event,
        key: "smallBlind" | "bigBlind" | "ante"
    ) {
        const target = event.target as HTMLInputElement;
        const nextValue = this.parseNumber(target.value);
        if (nextValue === null) {
            return;
        }
        if (key === "smallBlind") {
            handRecorderStore.setSmallBlind(nextValue);
        }
        if (key === "bigBlind") {
            handRecorderStore.setBigBlind(nextValue);
        }
        if (key === "ante") {
            handRecorderStore.setAnte(nextValue);
        }
        handRecorderStore.clearValidationErrors();
    }

    private handlePlayerNameChange(seatIndex: number, value: string) {
        handRecorderStore.updatePlayer(seatIndex, { displayName: value });
        handRecorderStore.clearValidationErrors();
    }

    private handlePlayerStackChange(seatIndex: number, value: string) {
        const nextValue = this.parseNumber(value);
        if (nextValue === null) {
            return;
        }
        handRecorderStore.updatePlayer(seatIndex, { stackAtStart: nextValue });
        handRecorderStore.clearValidationErrors();
    }

    private handlePlayerToggle(seatIndex: number, isActive: boolean) {
        if (!isActive) {
            const player = handRecorderStore.players.find(
                (candidate) => candidate.seatIndex === seatIndex
            );
            if (player) {
                player.showdownCards.forEach((card) => {
                    if (card) {
                        deckStore.markCardAsUnselected(card);
                    }
                });
            }
        }
        handRecorderStore.setPlayerActive(seatIndex, isActive);
        handRecorderStore.clearValidationErrors();
    }

    private handleHeroToggle(seatIndex: number) {
        handRecorderStore.setHero(seatIndex);
        handRecorderStore.clearValidationErrors();
    }

    private openCardPicker(context: CardPickerContext) {
        this.cardPickerContext = context;
        this.isCardPickerOpen = true;
    }

    private closeCardPicker() {
        this.isCardPickerOpen = false;
        this.cardPickerContext = null;
    }

    private clearPlayerCard(seatIndex: number, cardIndex: 0 | 1) {
        const player = handRecorderStore.players.find(
            (candidate) => candidate.seatIndex === seatIndex
        );
        if (!player) {
            return;
        }
        const existingCard = player.showdownCards[cardIndex];
        if (existingCard) {
            deckStore.markCardAsUnselected(existingCard);
        }
        handRecorderStore.setPlayerHoleCard(seatIndex, cardIndex, null);
        handRecorderStore.clearValidationErrors();
    }

    private clearBoardCard(boardIndex: number) {
        const existingCard =
            handRecorderStore.gameSettings.board[boardIndex] ?? null;
        if (existingCard) {
            deckStore.markCardAsUnselected(existingCard);
        }
        handRecorderStore.setBoardCard(boardIndex, null);
        handRecorderStore.clearValidationErrors();
    }

    private getCardSelectionTarget(): CardSelectionTarget | undefined {
        if (!this.cardPickerContext) {
            return undefined;
        }
        return {
            isCardUsed: (card: Card) => handRecorderStore.isCardUsed(card),
            setCard: (card: Card) => {
                if (!this.cardPickerContext) {
                    return false;
                }
                if (this.cardPickerContext.kind === "player") {
                    const { seatIndex, cardIndex } = this.cardPickerContext;
                    const player = handRecorderStore.players.find(
                        (candidate) => candidate.seatIndex === seatIndex
                    );
                    const existingCard = player?.showdownCards[cardIndex];
                    if (existingCard) {
                        deckStore.markCardAsUnselected(existingCard);
                    }
                    handRecorderStore.setPlayerHoleCard(
                        seatIndex,
                        cardIndex,
                        card
                    );
                } else {
                    const { boardIndex } = this.cardPickerContext;
                    const existingCard =
                        handRecorderStore.gameSettings.board[boardIndex] ??
                        null;
                    if (existingCard) {
                        deckStore.markCardAsUnselected(existingCard);
                    }
                    handRecorderStore.setBoardCard(boardIndex, card);
                }
                handRecorderStore.clearValidationErrors();
                return true;
            },
            closePicker: () => this.closeCardPicker(),
        };
    }

    private getFieldErrors(key: string): string[] {
        return handRecorderStore.validationErrors[key] ?? [];
    }

    private getPlayerErrors(seatIndex: number): string[] {
        const errors = handRecorderStore.validationErrors.players ?? [];
        return errors.filter((message) =>
            message.includes(`seat ${seatIndex + 1}`)
        );
    }

    private renderErrors(errors: string[]) {
        if (errors.length === 0) {
            return null;
        }
        return html`
            <div class="field-errors">
                ${errors.map(
                    (error) => html`<div class="field-error">${error}</div>`
                )}
            </div>
        `;
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

    private showToast(message: string, variant: "success" | "error") {
        this.toastMessage = message;
        this.toastVariant = variant;
        if (this.toastTimeoutId) {
            window.clearTimeout(this.toastTimeoutId);
        }
        this.toastTimeoutId = window.setTimeout(() => {
            this.toastMessage = null;
            this.toastTimeoutId = null;
        }, 4000);
    }

    private isMinimumValid(): boolean {
        const { tableSize, buttonSeat, smallBlind, bigBlind, ante } =
            handRecorderStore.gameSettings;
        if (tableSize < 2 || tableSize > 9) {
            return false;
        }
        if (buttonSeat < 0 || buttonSeat >= tableSize) {
            return false;
        }
        if (smallBlind <= 0 || bigBlind <= smallBlind) {
            return false;
        }
        if (ante < 0) {
            return false;
        }
        const activePlayers = handRecorderStore.players.filter(
            (player) => player.isActive
        );
        if (activePlayers.length < 2) {
            return false;
        }
        if (
            activePlayers.some(
                (player) =>
                    !player.displayName.trim() || player.stackAtStart <= 0
            )
        ) {
            return false;
        }
        if (handRecorderStore.actions.length < 1) {
            return false;
        }
        return true;
    }

    private async handleSave() {
        if (this.isSaving) {
            return;
        }
        this.isSaving = true;
        try {
            const handId = await handRecorderStore.saveHand();
            if (!handId) {
                this.isSaving = false;
                return;
            }
            this.showToast(`Saved hand ${handId}.`, "success");
            window.setTimeout(() => {
                routerStore.navigate("/hand-library");
            }, 600);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Failed to save hand.";
            this.showToast(message, "error");
        } finally {
            this.isSaving = false;
        }
    }

    private renderGameSettings() {
        const { tableSize, buttonSeat, smallBlind, bigBlind, ante } =
            handRecorderStore.gameSettings;

        return html`
            <div class="form-grid">
                <div class="form-section">
                    <h4>Stakes</h4>
                    <label class="field">
                        <sp-field-label>Small Blind *</sp-field-label>
                        <sp-number-field
                            min="1"
                            .value=${String(smallBlind)}
                            @input=${(event: Event) =>
                                this.handleSettingChange(event, "smallBlind")}
                        ></sp-number-field>
                        ${this.renderErrors(
                            this.getFieldErrors("hand.small_blind")
                        )}
                    </label>
                    <label class="field">
                        <sp-field-label>Big Blind *</sp-field-label>
                        <sp-number-field
                            min="1"
                            .value=${String(bigBlind)}
                            @input=${(event: Event) =>
                                this.handleSettingChange(event, "bigBlind")}
                        ></sp-number-field>
                        ${this.renderErrors(
                            this.getFieldErrors("hand.big_blind")
                        )}
                    </label>
                </div>

                <div class="form-section">
                    <h4>Blinds</h4>
                    <label class="field">
                        <sp-field-label>Ante</sp-field-label>
                        <sp-number-field
                            min="0"
                            .value=${String(ante)}
                            @input=${(event: Event) =>
                                this.handleSettingChange(event, "ante")}
                        ></sp-number-field>
                        ${this.renderErrors(this.getFieldErrors("hand.ante"))}
                    </label>
                </div>

                <div class="form-section">
                    <h4>Button Position</h4>
                    <label class="field">
                        <sp-field-label>Dealer Button *</sp-field-label>
                        <sp-picker
                            .value=${String(buttonSeat)}
                            @change=${this.handleButtonSeatChange}
                        >
                            ${Array.from({ length: tableSize }, (_, index) => {
                                return html`
                                    <sp-menu-item value=${index}>
                                        Seat ${index + 1}
                                    </sp-menu-item>
                                `;
                            })}
                        </sp-picker>
                        ${this.renderErrors(
                            this.getFieldErrors("hand.button_seat")
                        )}
                    </label>
                </div>

                <div class="form-section">
                    <h4>Player Count</h4>
                    <label class="field">
                        <sp-field-label>Number of Players *</sp-field-label>
                        <sp-picker
                            .value=${String(tableSize)}
                            @change=${this.handleTableSizeChange}
                        >
                            ${Array.from({ length: 8 }, (_, index) => {
                                const size = index + 2;
                                return html`
                                    <sp-menu-item value=${size}>
                                        ${size} players
                                    </sp-menu-item>
                                `;
                            })}
                        </sp-picker>
                        ${this.renderErrors(
                            this.getFieldErrors("hand.table_size")
                        )}
                    </label>
                </div>
            </div>
        `;
    }

    private renderPlayerSettings() {
        const { tableSize } = handRecorderStore.gameSettings;
        const players = handRecorderStore.players;
        const generalPlayerErrors = this.getFieldErrors("players").filter(
            (message) => !message.includes("seat ")
        );

        return html`
            <div class="players-section">
                <div class="players-header">
                    <h4>Player Setup</h4>
                    <div class="players-subtitle">
                        Add players, assign stacks, and mark the hero.
                    </div>
                </div>
                ${this.renderErrors(generalPlayerErrors)}
                <div class="players-grid">
                    ${Array.from({ length: tableSize }, (_, index) => {
                        const player = players[index];
                        const playerErrors = this.getPlayerErrors(index);
                        const isActive = player?.isActive ?? false;
                        return html`
                            <div
                                class="player-card ${isActive
                                    ? "active"
                                    : "inactive"}"
                            >
                                <div class="player-title">
                                    <span>Seat ${index + 1}</span>
                                    <sp-action-button
                                        class="player-toggle"
                                        size="s"
                                        @click=${() =>
                                            this.handlePlayerToggle(
                                                index,
                                                !isActive
                                            )}
                                    >
                                        ${isActive ? "Remove" : "Add player"}
                                    </sp-action-button>
                                </div>
                                ${isActive
                                    ? html`
                                          <label class="field">
                                              <sp-field-label
                                                  >Name *</sp-field-label
                                              >
                                              <sp-textfield
                                                  placeholder="Player name"
                                                  .value=${player?.displayName ??
                                                  ""}
                                                  @input=${(event: Event) => {
                                                      const target =
                                                          event.target as HTMLInputElement;
                                                      this.handlePlayerNameChange(
                                                          index,
                                                          target.value
                                                      );
                                                  }}
                                              ></sp-textfield>
                                          </label>
                                          <label class="field">
                                              <sp-field-label
                                                  >Stack Size *</sp-field-label
                                              >
                                              <sp-number-field
                                                  min="1"
                                                  .value=${String(
                                                      player?.stackAtStart ?? 0
                                                  )}
                                                  @input=${(event: Event) => {
                                                      const target =
                                                          event.target as HTMLInputElement;
                                                      this.handlePlayerStackChange(
                                                          index,
                                                          target.value
                                                      );
                                                  }}
                                              ></sp-number-field>
                                          </label>
                                          <div class="player-actions">
                                              <sp-action-button
                                                  class="hero-toggle"
                                                  size="s"
                                                  ?selected=${player?.isHero}
                                                  @click=${() =>
                                                      this.handleHeroToggle(
                                                          index
                                                      )}
                                              >
                                                  Hero
                                              </sp-action-button>
                                          </div>
                                          <div class="hole-cards">
                                              <div class="hole-card">
                                                  <sp-field-label
                                                      >Hole Card
                                                      1</sp-field-label
                                                  >
                                                  <sp-action-button
                                                      class="card-slot ${player
                                                          ?.showdownCards[0]
                                                          ? "filled"
                                                          : ""}"
                                                      @click=${() =>
                                                          this.openCardPicker({
                                                              kind: "player",
                                                              seatIndex: index,
                                                              cardIndex: 0,
                                                          })}
                                                  >
                                                      ${this.formatCard(
                                                          player
                                                              ?.showdownCards[0] ??
                                                              null
                                                      )}
                                                  </sp-action-button>
                                                  <sp-action-button
                                                      class="clear-card"
                                                      size="s"
                                                      ?disabled=${!player
                                                          ?.showdownCards[0]}
                                                      @click=${() =>
                                                          this.clearPlayerCard(
                                                              index,
                                                              0
                                                          )}
                                                  >
                                                      Clear
                                                  </sp-action-button>
                                              </div>
                                              <div class="hole-card">
                                                  <sp-field-label
                                                      >Hole Card
                                                      2</sp-field-label
                                                  >
                                                  <sp-action-button
                                                      class="card-slot ${player
                                                          ?.showdownCards[1]
                                                          ? "filled"
                                                          : ""}"
                                                      @click=${() =>
                                                          this.openCardPicker({
                                                              kind: "player",
                                                              seatIndex: index,
                                                              cardIndex: 1,
                                                          })}
                                                  >
                                                      ${this.formatCard(
                                                          player
                                                              ?.showdownCards[1] ??
                                                              null
                                                      )}
                                                  </sp-action-button>
                                                  <sp-action-button
                                                      class="clear-card"
                                                      size="s"
                                                      ?disabled=${!player
                                                          ?.showdownCards[1]}
                                                      @click=${() =>
                                                          this.clearPlayerCard(
                                                              index,
                                                              1
                                                          )}
                                                  >
                                                      Clear
                                                  </sp-action-button>
                                              </div>
                                          </div>
                                          ${this.renderErrors(playerErrors)}
                                      `
                                    : html`<div class="player-inactive">
                                          Not in this hand.
                                      </div>`}
                            </div>
                        `;
                    })}
                </div>
            </div>
        `;
    }

    private renderBoardCards() {
        const board = handRecorderStore.gameSettings.board;
        const renderBoardSlot = (index: number) => {
            const card = board[index];
            return html`
                <div class="board-slot">
                    <sp-action-button
                        class="card-slot ${card ? "filled" : ""}"
                        @click=${() =>
                            this.openCardPicker({
                                kind: "board",
                                boardIndex: index,
                            })}
                    >
                        ${this.formatCard(card)}
                    </sp-action-button>
                    <sp-action-button
                        class="clear-card"
                        size="s"
                        ?disabled=${!card}
                        @click=${() => this.clearBoardCard(index)}
                    >
                        Clear
                    </sp-action-button>
                </div>
            `;
        };

        return html`
            <div class="board-section">
                <div class="board-row">
                    <div class="board-label">Flop</div>
                    <div class="board-cards">
                        ${[0, 1, 2].map((index) => renderBoardSlot(index))}
                    </div>
                </div>
                <div class="board-row">
                    <div class="board-label">Turn</div>
                    <div class="board-cards">${renderBoardSlot(3)}</div>
                </div>
                <div class="board-row">
                    <div class="board-label">River</div>
                    <div class="board-cards">${renderBoardSlot(4)}</div>
                </div>
            </div>
        `;
    }

    render() {
        const canSave = this.isMinimumValid() && !this.isSaving;
        return html`
            <section class="hand-recorder">
                <div class="section-header">
                    <h3>Hand Recorder</h3>
                    <div class="section-subtitle">
                        Enter game settings and player stacks before recording
                        actions.
                    </div>
                </div>
                ${this.toastMessage
                    ? html`
                          <div class="toast ${this.toastVariant}">
                              ${this.toastMessage}
                          </div>
                      `
                    : null}
                ${this.renderGameSettings()} ${this.renderPlayerSettings()}
                <div class="form-section">
                    <h4>Board Cards</h4>
                    <div class="section-subtitle">
                        Select flop, turn, and river cards as needed.
                    </div>
                    ${this.renderBoardCards()}
                </div>
                <div class="form-section">
                    <h4>Actions</h4>
                    ${this.renderErrors(this.getFieldErrors("actions"))}
                    <action-recorder></action-recorder>
                </div>
                <div class="footer-actions">
                    <sp-button
                        variant="cta"
                        ?disabled=${!canSave}
                        @click=${this.handleSave}
                    >
                        ${this.isSaving ? "Saving..." : "Save hand"}
                    </sp-button>
                </div>
            </section>
            <card-picker-modal
                .isOpen=${this.isCardPickerOpen}
                .selectionTarget=${this.getCardSelectionTarget()}
                .closeOnSelect=${true}
                .onClose=${() => this.closeCardPicker()}
            ></card-picker-modal>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [HandRecorder.TAG_NAME]: HandRecorder;
    }
}
