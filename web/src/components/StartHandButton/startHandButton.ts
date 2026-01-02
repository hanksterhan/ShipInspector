import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { handBuilderStore } from "../../stores/index";

@customElement("start-hand-button")
export class StartHandButton extends MobxLitElement {
    static readonly TAG_NAME = "start-hand-button";

    static get styles() {
        return styles;
    }

    handleClick() {
        handBuilderStore.toggleHandBuilderTray();
    }

    render() {
        const { handBuilderTrayOpen } = handBuilderStore;

        return html`
            <button
                class="start-button ${handBuilderTrayOpen ? "active" : ""}"
                @click=${this.handleClick}
            >
                ${handBuilderTrayOpen ? "Close Hand Builder" : "Start Hand"}
            </button>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [StartHandButton.TAG_NAME]: StartHandButton;
    }
}
