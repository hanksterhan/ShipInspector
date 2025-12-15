import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

@customElement("board-selector")
export class BoardSelector extends MobxLitElement {
    static readonly TAG_NAME = "board-selector";
    static get styles() {
        return styles;
    }

    @property({ type: String })
    placeholderProperty: string = "";

    render() {
        return html`
            <h2>BoardSelector Component</h2>
            <p>Welcome to the BoardSelector Component</p>
        `;
    }
}
