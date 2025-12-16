import { MenuStore } from "./MenuStore";
import { CardStore } from "./CardStore";
import { DeckStore } from "./DeckStore";
import { EquityStore } from "./EquityStore";
// PLOP: APPEND STORE IMPORTS

export const menuStore = new MenuStore();
export * from "./CardStore";
export const cardStore = new CardStore();
export * from "./DeckStore";
export const deckStore = new DeckStore();
export * from "./EquityStore";
export const equityStore = new EquityStore();
// PLOP: APPEND STORE EXPORTS
