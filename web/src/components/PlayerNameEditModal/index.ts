export * from "./PlayerNameEditModal";
import { PlayerNameEditModal } from "./PlayerNameEditModal";

const TAG_NAME = "player-name-edit-modal";

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, PlayerNameEditModal);
}

declare global {
    interface HTMLElementTagNameMap {
        [TAG_NAME]: PlayerNameEditModal;
    }
}
