export * from "./boardCards";
import { BoardCards } from "./boardCards";

const TAG_NAME = "board-cards";

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, BoardCards);
}

declare global {
    interface HTMLElementTagNameMap {
        [TAG_NAME]: BoardCards;
    }
}
