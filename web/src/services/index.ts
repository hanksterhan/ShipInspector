import { PokerService } from "./pokerService";
import { AuthService } from "./authService";
// PLOP: APPEND SERVICE IMPORTS

export const pokerService = new PokerService();
export const authService = new AuthService();
export { clerkService } from "./clerkService";
// PLOP: APPEND SERVICE EXPORTS
