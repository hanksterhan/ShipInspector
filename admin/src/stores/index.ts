import { MenuStore } from "./MenuStore";
import { AuthStore } from "./AuthStore";
import { RouterStore } from "./RouterStore";
// PLOP: APPEND STORE IMPORTS

export const menuStore = new MenuStore();
export * from "./AuthStore";
export const authStore = new AuthStore();
export * from "./RouterStore";
export const routerStore = new RouterStore();
// PLOP: APPEND STORE EXPORTS
