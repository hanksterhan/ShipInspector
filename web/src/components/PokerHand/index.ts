export * from "./pokerHand";
import { PokerHand } from "./pokerHand";

const TAG_NAME = "poker-hand";

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, PokerHand);
}

declare global {
    interface HTMLElementTagNameMap {
        [TAG_NAME]: PokerHand;
    }
}
