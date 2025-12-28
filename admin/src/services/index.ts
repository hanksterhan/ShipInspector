import { PokerService } from "./pokerService";
import { AuthService } from "./authService";
import { InviteCodeService } from "./inviteCodeService";
// PLOP: APPEND SERVICE IMPORTS

export const pokerService = new PokerService();
export const authService = new AuthService();
export const inviteCodeService = new InviteCodeService();
export { clerkService } from "./clerkService";
// PLOP: APPEND SERVICE EXPORTS
