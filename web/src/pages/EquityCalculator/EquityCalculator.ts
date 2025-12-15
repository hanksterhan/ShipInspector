import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";

@customElement("equity-calculator")
export class EquityCalculator extends MobxLitElement {
    static readonly TAG_NAME = "equity-calculator";
    static get styles() {
        return styles;
    }

    @property({ type: String })
    placeholderProperty: string = "";

    render() {
        return html`
            <h2>EquityCalculator page</h2>
            <p>Welcome to the EquityCalculator page</p>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [EquityCalculator.TAG_NAME]: EquityCalculator;
    }
}
