import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { replayStore } from "../../stores/index";

@customElement("replay-configuration")
export class ReplayConfiguration extends MobxLitElement {
    static readonly TAG_NAME = "replay-configuration";
    static get styles() {
        return styles;
    }

    private tableSize: number = 4;
    private smallBlind: number = 10;
    private bigBlind: number = 20;

    handleCreateNew() {
        replayStore.createNewReplay(
            this.tableSize,
            this.smallBlind,
            this.bigBlind
        );
    }

    handleTableSizeChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const value = parseInt(target.value, 10);
        this.tableSize = value || 4;
        this.requestUpdate();
    }

    handleSmallBlindChange(e: Event) {
        const target = e.target as HTMLInputElement;
        this.smallBlind = parseFloat(target.value) || 10;
    }

    handleBigBlindChange(e: Event) {
        const target = e.target as HTMLInputElement;
        this.bigBlind = parseFloat(target.value) || 20;
    }

    handleButtonPositionChange(e: Event) {
        if (!replayStore.currentReplay) return;
        const target = e.target as HTMLSelectElement;
        const position = parseInt(target.value) || 0;
        replayStore.setButtonPosition(position);
    }

    render() {
        if (replayStore.currentReplay) {
            const buttonOptions = Array.from(
                { length: replayStore.currentReplay.tableSize },
                (_, i) => i
            );

            return html`
                <div class="config-container">
                    <h3>Hand Configuration</h3>
                    <div class="config-info">
                        <div>
                            <strong>Table Size:</strong> ${replayStore.currentReplay.tableSize}
                        </div>
                        <div>
                            <strong>Blinds:</strong> ${replayStore.currentReplay.smallBlind}/${replayStore.currentReplay.bigBlind}
                        </div>
                        <div class="button-position-selector">
                            <label for="button-position">Button Position:</label>
                            <select
                                id="button-position"
                                .value=${replayStore.currentReplay.buttonPosition.toString()}
                                @change=${this.handleButtonPositionChange}
                            >
                                ${buttonOptions.map(
                                    (pos) => html`
                                        <option value=${pos}>
                                            Position ${pos + 1}
                                        </option>
                                    `
                                )}
                            </select>
                        </div>
                        <div>
                            <strong>Players:</strong> ${replayStore.currentReplay.players.length}
                        </div>
                    </div>
                    <button @click=${() => replayStore.resetReplay()}>
                        Start New Hand
                    </button>
                </div>
            `;
        }

        return html`
            <div class="config-container">
                <h3>Create New Hand Replay</h3>
                <div class="config-form">
                    <div class="form-group">
                        <sp-slider
                            id="table-size-slider"
                            class="table-size-slider"
                            min="2"
                            max="10"
                            value=${this.tableSize}
                            step="1"
                            @input=${this.handleTableSizeChange}
                            label="Table Size: ${this.tableSize}"
                        >
                        </sp-slider>
                    </div>
                    <div class="form-group">
                        <label for="small-blind">Small Blind:</label>
                        <input
                            type="number"
                            id="small-blind"
                            min="0.5"
                            step="0.5"
                            .value=${this.smallBlind.toString()}
                            @change=${this.handleSmallBlindChange}
                        />
                    </div>
                    <div class="form-group">
                        <label for="big-blind">Big Blind:</label>
                        <input
                            type="number"
                            id="big-blind"
                            min="1"
                            step="0.5"
                            .value=${this.bigBlind.toString()}
                            @change=${this.handleBigBlindChange}
                        />
                    </div>
                    <button @click=${this.handleCreateNew}>
                        Create New Hand
                    </button>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [ReplayConfiguration.TAG_NAME]: ReplayConfiguration;
    }
}

