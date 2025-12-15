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
            <player-selector></player-selector>
            <hole-selector></hole-selector>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [EquityCalculator.TAG_NAME]: EquityCalculator;
    }
}
