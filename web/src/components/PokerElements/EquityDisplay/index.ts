export * from "./equityDisplay";
import { EquityDisplay } from "./equityDisplay";

const TAG_NAME = "equity-display";

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, EquityDisplay);
}

declare global {
    interface HTMLElementTagNameMap {
        [TAG_NAME]: EquityDisplay;
    }
}
