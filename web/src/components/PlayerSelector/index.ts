export * from "./playerSelector";
import { PlayerSelector } from "./playerSelector";

const TAG_NAME = "player-selector";

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, PlayerSelector);
}

declare global {
    interface HTMLElementTagNameMap {
        [TAG_NAME]: PlayerSelector;
    }
}
