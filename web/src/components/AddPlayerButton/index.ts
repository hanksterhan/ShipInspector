export * from "./addPlayerButton";
import { AddPlayerButton } from "./addPlayerButton";

const TAG_NAME = "add-player-button";

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, AddPlayerButton);
}

declare global {
    interface HTMLElementTagNameMap {
        [TAG_NAME]: AddPlayerButton;
    }
}
