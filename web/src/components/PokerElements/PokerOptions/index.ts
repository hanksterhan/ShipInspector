export * from "./pokerOptions";
import { PokerOptions } from "./pokerOptions";

const TAG_NAME = "poker-options";

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, PokerOptions);
}

declare global {
    interface HTMLElementTagNameMap {
        [TAG_NAME]: PokerOptions;
    }
}
