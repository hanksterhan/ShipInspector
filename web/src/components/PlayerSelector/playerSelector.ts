import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { cardStore, deckStore } from "../../stores/index";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 12;

@customElement("player-selector")
export class PlayerSelector extends MobxLitElement {
    static readonly TAG_NAME = "player-selector";
    static get styles() {
        return styles;
    }

    handleSliderChange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value, 10);
        cardStore.setPlayers(value);
    };

    handleReset = () => {
        cardStore.resetHoleSelection();
        cardStore.setBoardCards([]);
        deckStore.clearSelectedCards();
    };

    render() {
        return html`
            <div class="player-selector-container">
                <div class="player-controls-row">
                    <sp-slider
                        id="player-slider"
                        class="player-slider"
                        min=${MIN_PLAYERS}
                        max=${MAX_PLAYERS}
                        value=${cardStore.players}
                        step="1"
                        @input=${this.handleSliderChange}
                        label="Number of Players: ${cardStore.players}"
                    >
                    </sp-slider>
                    <sp-action-button
                        class="reset-button"
                        @click=${this.handleReset}
                    >
                        Reset
                    </sp-action-button>
                </div>
            </div>
        `;
    }
}
