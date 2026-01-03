export * from "./blindControls";
import { BlindControls } from "./blindControls";

const TAG_NAME = "blind-controls";

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, BlindControls);
}

declare global {
    interface HTMLElementTagNameMap {
        [TAG_NAME]: BlindControls;
    }
}
