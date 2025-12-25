import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { settingsStore } from "../../stores/index";
import { closeIcon } from "../../assets/index";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 12;

@customElement("poker-options")
export class PokerOptions extends MobxLitElement {
    static readonly TAG_NAME = "poker-options";
    static get styles() {
        return styles;
    }

    handleSliderChange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value, 10);
        settingsStore.setPlayers(value);
    };

    handleCardSelectionModeChange = (
        mode: "Suit - Rank Selection" | "52 Cards"
    ) => {
        settingsStore.setCardSelectionMode(mode);
    };

    handleReset = () => {
        settingsStore.resetSettings();
    };

    render() {
        return html`
            <div class="player-selector-container">
                <sp-action-button
                    class="close-button"
                    @click=${() => settingsStore.setTrayOpen(false)}
                    quiet
                    title="Close settings"
                    size="s"
                >
                    <span slot="icon" class="close-icon">${closeIcon}</span>
                </sp-action-button>
                <div class="player-controls-row">
                    <sp-slider
                        id="player-slider"
                        class="player-slider"
                        min=${MIN_PLAYERS}
                        max=${MAX_PLAYERS}
                        value=${settingsStore.players}
                        step="1"
                        @input=${this.handleSliderChange}
                        label="Number of players: ${settingsStore.players}"
                    >
                    </sp-slider>
                    <sp-action-button
                        class="reset-button"
                        @click=${this.handleReset}
                    >
                        Reset
                    </sp-action-button>
                </div>
                <div class="mode-selectors-row">
                    <div class="card-selection-mode-container">
                        <sp-field-label>Card selection mode</sp-field-label>
                        <sp-action-group
                            selects="single"
                            .selected=${[settingsStore.cardSelectionMode]}
                            @change=${(e: CustomEvent) => {
                                const target = e.target as any;
                                const selectedValue = Array.isArray(
                                    target.selected
                                )
                                    ? target.selected[0]
                                    : target.selected;
                                this.handleCardSelectionModeChange(
                                    selectedValue as
                                        | "Suit - Rank Selection"
                                        | "52 Cards"
                                );
                            }}
                            class="selection-mode-buttons"
                        >
                            <sp-action-button value="Suit - Rank Selection">
                                Suit - Rank Selection
                            </sp-action-button>
                            <sp-action-button value="52 Cards">
                                52 Cards
                            </sp-action-button>
                        </sp-action-group>
                    </div>
                </div>
            </div>
        `;
    }
}
