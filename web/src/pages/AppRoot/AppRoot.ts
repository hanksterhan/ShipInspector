import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";

import { menuStore } from "../../stores/index";

@customElement("app-root")
export class AppRoot extends MobxLitElement {
    static readonly TAG_NAME = "app-root";
    static get styles() {
        return styles;
    }

    @property({ type: String })
    selectedPage: string = menuStore.selectedPage;

    render() {
        return html`
            <sp-theme system="spectrum" color="light" scale="medium" dir="ltr">
                <div class="app-root-flex-container">
                    <app-menu></app-menu>
                    <div class="app-root-content">
                        ${menuStore.selectedPage === "poker-hands"
                            ? html`<poker-hands></poker-hands>`
                            : ""}
                        ${menuStore.selectedPage === "equity-calculator"
                            ? html`<equity-calculator></equity-calculator>`
                            : ""}
                    </div>
                </div>
            </sp-theme>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [AppRoot.TAG_NAME]: AppRoot;
    }
}
