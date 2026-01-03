export * from "./alertModal";
import { AlertModal } from "./alertModal";

const TAG_NAME = "alert-modal";

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, AlertModal);
}

declare global {
    interface HTMLElementTagNameMap {
        [TAG_NAME]: AlertModal;
    }
}
