import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";

@customElement("league-page")
export class LeaguePage extends MobxLitElement {
    static readonly TAG_NAME = "league-page";
    static get styles() {
        return styles;
    }

    @property({ type: String })
    placeholderProperty: string = "";

    render() {
        return html`
            <h2>LeaguePage page</h2>
            <p>Welcome to the LeaguePage page</p>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [LeaguePage.TAG_NAME]: LeaguePage;
    }
}
