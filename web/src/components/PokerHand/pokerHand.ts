import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

@customElement("poker-hand")
export class PokerHand extends MobxLitElement {
    static readonly TAG_NAME = "poker-hand";
    static get styles() {
        return styles;
    }

    @property({ type: String })
    placeholderProperty: string = "";

    render() {
        return html`
            <h2>PokerHand Component</h2>
            <p>Welcome to the PokerHand Component</p>
        `;
    }
}
