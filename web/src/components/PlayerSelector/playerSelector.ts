import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

@customElement("player-selector")
export class PlayerSelector extends MobxLitElement {
    static readonly TAG_NAME = "player-selector";
    static get styles() {
        return styles;
    }

    @property({ type: String })
    placeholderProperty: string = "";

    render() {
        return html`
            <h2>PlayerSelector Component</h2>
            <p>Welcome to the PlayerSelector Component</p>
        `;
    }
}
