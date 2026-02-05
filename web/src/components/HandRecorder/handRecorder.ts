import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { handRecorderStore } from "../../stores";

@customElement("hand-recorder")
export class HandRecorder extends MobxLitElement {
    static readonly TAG_NAME = "hand-recorder";
    static get styles() {
        return styles;
    }

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
        handRecorderStore.setTableSize(Math.round(nextValue));
        handRecorderStore.clearValidationErrors();
    }

    private handleButtonSeatChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const nextValue = this.parseNumber(target.value);
        if (nextValue === null) {
            return;
        }
        handRecorderStore.updateGameSettings({ buttonSeat: nextValue });
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
            handRecorderStore.updateGameSettings({ smallBlind: nextValue });
        }
        if (key === "bigBlind") {
            handRecorderStore.updateGameSettings({ bigBlind: nextValue });
        }
        if (key === "ante") {
            handRecorderStore.updateGameSettings({ ante: nextValue });
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

    private getFieldErrors(key: string): string[] {
        return handRecorderStore.validationErrors[key] ?? [];
    }

    private getPlayerErrors(seatIndex: number): string[] {
        const errors = handRecorderStore.validationErrors.players ?? [];
        return errors.filter((message) =>
            message.includes(`seat ${seatIndex}`)
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

    private handleProceed() {
        handRecorderStore.validateSetup();
    }

    private renderGameSettings() {
        const { tableSize, buttonSeat, smallBlind, bigBlind, ante } =
            handRecorderStore.gameSettings;

        return html`
            <div class="form-grid">
                <div class="form-section">
                    <h4>Stakes</h4>
                    <label class="field">
                        <sp-field-label>Small Blind</sp-field-label>
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
                        <sp-field-label>Big Blind</sp-field-label>
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
                        <sp-field-label>Dealer Button</sp-field-label>
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
                        <sp-field-label>Number of Players</sp-field-label>
                        <sp-number-field
                            min="2"
                            max="10"
                            .value=${String(tableSize)}
                            @input=${this.handleTableSizeChange}
                        ></sp-number-field>
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
                        Position, stack size, and optional name.
                    </div>
                </div>
                ${this.renderErrors(generalPlayerErrors)}
                <div class="players-grid">
                    ${Array.from({ length: tableSize }, (_, index) => {
                        const player = players[index];
                        const playerErrors = this.getPlayerErrors(index);
                        return html`
                            <div class="player-card">
                                <div class="player-title">
                                    Seat ${index + 1}
                                </div>
                                <label class="field">
                                    <sp-field-label>Position</sp-field-label>
                                    <sp-textfield
                                        readonly
                                        .value=${`Seat ${index + 1}`}
                                    ></sp-textfield>
                                </label>
                                <label class="field">
                                    <sp-field-label
                                        >Name (optional)</sp-field-label
                                    >
                                    <sp-textfield
                                        placeholder="Player name"
                                        .value=${player?.displayName ?? ""}
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
                                    <sp-field-label>Stack Size</sp-field-label>
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
                                ${this.renderErrors(playerErrors)}
                            </div>
                        `;
                    })}
                </div>
            </div>
        `;
    }

    render() {
        return html`
            <section class="hand-recorder">
                <div class="section-header">
                    <h3>Hand Recorder</h3>
                    <div class="section-subtitle">
                        Enter game settings and player stacks before recording
                        actions.
                    </div>
                </div>
                ${this.renderGameSettings()} ${this.renderPlayerSettings()}
                <div class="footer-actions">
                    <sp-button variant="cta" @click=${this.handleProceed}>
                        Continue to actions
                    </sp-button>
                </div>
            </section>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [HandRecorder.TAG_NAME]: HandRecorder;
    }
}
