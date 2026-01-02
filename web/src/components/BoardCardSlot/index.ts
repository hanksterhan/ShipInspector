export * from "./boardCardSlot";
import { BoardCardSlot } from "./boardCardSlot";

const TAG_NAME = "board-card-slot";

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, BoardCardSlot);
}

declare global {
    interface HTMLElementTagNameMap {
        [TAG_NAME]: BoardCardSlot;
    }
}
