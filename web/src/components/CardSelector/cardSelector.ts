import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

@customElement("card-selector")
export class CardSelector extends MobxLitElement {
    static readonly TAG_NAME = "card-selector";
    static get styles() {
        return styles;
    }

    @property({ type: String })
    placeholderProperty: string = "";

    render() {
        return html`
            <h2>CardSelector Component</h2>
            <p>Welcome to the CardSelector Component</p>
        `;
    }
}
