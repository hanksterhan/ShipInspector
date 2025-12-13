import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";

@customElement("fantasy-football")
export class FantasyFootball extends MobxLitElement {
    static readonly TAG_NAME = "fantasy-football";
    static get styles() {
        return styles;
    }

    @property({ type: String })
    placeholderProperty: string = "";

    render() {
        return html`
            <h2>FantasyFootball page</h2>
            <p>Welcome to the FantasyFootball page</p>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [FantasyFootball.TAG_NAME]: FantasyFootball;
    }
}
