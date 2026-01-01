import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { addPlayerIcon } from "../../assets";

/**
 * AddPlayerButton component - Button to add a player at a specific position
 */
@customElement("add-player-button")
export class AddPlayerButton extends MobxLitElement {
    static readonly TAG_NAME = "add-player-button";
    static get styles() {
        return styles;
    }

    @property({ type: Number })
    playerIndex: number = 0;

    @property({ type: Function })
    onClick: ((playerIndex: number) => void) | null = null;

    handleClick() {
        if (this.onClick) {
            this.onClick(this.playerIndex);
        }
    }

    render() {
        return html`
            <button
                class="add-player-button"
                @click=${this.handleClick}
                title="Add Player ${this.playerIndex + 1}"
            >
                <span class="add-player-text">Add player</span>
                <span class="add-player-icon">${addPlayerIcon}</span>
            </button>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [AddPlayerButton.TAG_NAME]: AddPlayerButton;
    }
}
