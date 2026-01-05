export * from "./actionTimeline";
import { ActionTimeline } from "./actionTimeline";

const TAG_NAME = "action-timeline";

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, ActionTimeline);
}

declare global {
    interface HTMLElementTagNameMap {
        [TAG_NAME]: ActionTimeline;
    }
}
