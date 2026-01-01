import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { settingsStore } from "../../stores/index";
import { closeIcon } from "../../assets/index";

@customElement("poker-options")
export class PokerOptions extends MobxLitElement {
    static readonly TAG_NAME = "poker-options";
    static get styles() {
        return styles;
    }

    handleCardSelectionModeChange = (
        mode: "Suit - Rank Selection" | "52 Cards"
    ) => {
        settingsStore.setCardSelectionMode(mode);
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
