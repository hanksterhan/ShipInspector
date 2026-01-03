export * from "./pokerTable";
import { PokerTable } from "./pokerTable";

const TAG_NAME = "poker-table";

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, PokerTable);
}

declare global {
    interface HTMLElementTagNameMap {
        [TAG_NAME]: PokerTable;
    }
}
