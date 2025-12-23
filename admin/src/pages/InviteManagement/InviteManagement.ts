import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";

@customElement("invite-management")
export class InviteManagement extends MobxLitElement {
    static readonly TAG_NAME = "invite-management";
    static get styles() {
        return styles;
    }

    @property({ type: String })
    placeholderProperty: string = "";

    render() {
        return html`
            <h2>InviteManagement page</h2>
            <p>Welcome to the InviteManagement page</p>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [InviteManagement.TAG_NAME]: InviteManagement;
    }
}
