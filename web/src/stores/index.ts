import { MenuStore } from "./MenuStore";
import { CardStore } from "./CardStore";
import { DeckStore } from "./DeckStore";
import { EquityStore } from "./EquityStore";
import { SettingsStore } from "./SettingsStore";
import { AuthStore } from "./AuthStore";
import { RouterStore } from "./RouterStore";
// PLOP: APPEND STORE IMPORTS

export const menuStore = new MenuStore();
export * from "./CardStore";
export const cardStore = new CardStore();
export * from "./DeckStore";
export const deckStore = new DeckStore();
export * from "./EquityStore";
export const equityStore = new EquityStore();
export * from "./SettingsStore";
export const settingsStore = new SettingsStore();
export * from "./AuthStore";
export const authStore = new AuthStore();
export * from "./RouterStore";
export const routerStore = new RouterStore();
// PLOP: APPEND STORE EXPORTS
