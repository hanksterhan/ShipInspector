export * from "./cardSelector";
import { CardSelector } from "./cardSelector";

const TAG_NAME = "card-selector";

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, CardSelector);
}

declare global {
    interface HTMLElementTagNameMap {
        [TAG_NAME]: CardSelector;
    }
}
