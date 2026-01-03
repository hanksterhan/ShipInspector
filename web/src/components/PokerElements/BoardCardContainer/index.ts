export * from "./boardCardContainer";
import { BoardCardContainer } from "./boardCardContainer";

const TAG_NAME = "board-card-container";

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, BoardCardContainer);
}

declare global {
    interface HTMLElementTagNameMap {
        [TAG_NAME]: BoardCardContainer;
    }
}
