import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";

@customElement("poker-hands")
export class PokerHands extends MobxLitElement {
    static readonly TAG_NAME = "poker-hands";
    static get styles() {
        return styles;
    }

    @property({ type: String })
    placeholderProperty: string = "";

    render() {
        return html` <hole-selector></hole-selector> `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [PokerHands.TAG_NAME]: PokerHands;
    }
}
