export * from "./holeSelector";
import { HoleSelector } from "./holeSelector";

const TAG_NAME = "hole-selector";

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, HoleSelector);
}

declare global {
    interface HTMLElementTagNameMap {
        [TAG_NAME]: HoleSelector;
    }
}
