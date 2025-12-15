export * from "./boardSelector";
import { BoardSelector } from "./boardSelector";

const TAG_NAME = "board-selector";

if (!customElements.get(TAG_NAME)) {
  customElements.define(TAG_NAME, BoardSelector);
}

declare global {
  interface HTMLElementTagNameMap {
    [TAG_NAME]: BoardSelector;
  }
}
