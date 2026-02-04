import { PokerService } from "./pokerService";
import { AuthService } from "./authService";
import { HandService } from "./handService";
// PLOP: APPEND SERVICE IMPORTS

export const pokerService = new PokerService();
export const authService = new AuthService();
export const handService = new HandService();
export { clerkService } from "./clerkService";
// PLOP: APPEND SERVICE EXPORTS
