export * from "./cardPickerModal";
import { CardPickerModal } from "./cardPickerModal";

const TAG_NAME = "card-picker-modal";

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, CardPickerModal);
}

declare global {
    interface HTMLElementTagNameMap {
        [TAG_NAME]: CardPickerModal;
    }
}
