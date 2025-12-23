import { MenuStore } from "./MenuStore";
import { AuthStore } from "./AuthStore";
import { RouterStore } from "./RouterStore";
import { InviteCodeStore } from "./InviteCodeStore";
// PLOP: APPEND STORE IMPORTS

export const menuStore = new MenuStore();
export * from "./AuthStore";
export const authStore = new AuthStore();
export * from "./RouterStore";
export const routerStore = new RouterStore();
export * from "./InviteCodeStore";
export const inviteCodeStore = new InviteCodeStore();
// PLOP: APPEND STORE EXPORTS
