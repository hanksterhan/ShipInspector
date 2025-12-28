import { httpClient } from "./fetch";
import { clerkService } from "./clerkService";
import { User } from "../stores/AuthStore/authStore";

const AUTH_ENDPOINTS = {
    getCurrentUser: "/auth/me",
};

/**
 * Auth Service - Now uses Clerk for authentication
 * All login/register/logout is handled by Clerk UI components
 */
export class AuthService {
    /**
     * Get current user info from backend
     * Uses Clerk token for authentication
     */
    async getCurrentUser(): Promise<User> {
        try {
            const response = await httpClient.get(
                AUTH_ENDPOINTS.getCurrentUser
            );
            return response.user;
        } catch (error: any) {
            // If 401, user is not authenticated - this is expected and should be handled silently
            if (error.status === 401) {
                // Create a custom error that won't be logged as a real error
                const authError = new Error("Not authenticated");
                (authError as any).status = 401;
                (authError as any).isAuthError = true;
                throw authError;
            }
            throw error;
        }
    }

    /**
     * Sign out user through Clerk
     */
    async logout(): Promise<void> {
        try {
            const clerk = clerkService.getClerk();
            await clerk.signOut();
        } catch (error) {
            console.error("Logout error:", error);
            throw error;
        }
    }
}

export const authService = new AuthService();
