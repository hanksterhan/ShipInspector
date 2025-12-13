import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";

@customElement("fantasy-basketball")
export class FantasyBasketball extends MobxLitElement {
    static readonly TAG_NAME = "fantasy-basketball";
    static get styles() {
        return styles;
    }

    @property({ type: String })
    placeholderProperty: string = "";

    render() {
        return html`
            <h2>FantasyBasketball page</h2>
            <p>Welcome to the FantasyBasketball page</p>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [FantasyBasketball.TAG_NAME]: FantasyBasketball;
    }
}
