import { MenuStore } from "./MenuStore";
import { CardStore } from "./CardStore";
// PLOP: APPEND STORE IMPORTS

export const menuStore = new MenuStore();
export * from "./CardStore";
export const cardStore = new CardStore();
// PLOP: APPEND STORE EXPORTS
