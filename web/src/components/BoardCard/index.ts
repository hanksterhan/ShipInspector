export * from "./boardCard";
import { BoardCard } from "./boardCard";

const TAG_NAME = "board-card";

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, BoardCard);
}

declare global {
    interface HTMLElementTagNameMap {
        [TAG_NAME]: BoardCard;
    }
}
