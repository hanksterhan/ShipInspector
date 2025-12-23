import { httpClient } from "./fetch";
import { User } from "../stores/AuthStore/authStore";

const AUTH_ENDPOINTS = {
    login: "/auth/login",
    register: "/auth/register",
    logout: "/auth/logout",
    getCurrentUser: "/admin/auth/me", 
};

export class AuthService {
    async login(email: string, password: string): Promise<User> {
        const response = await httpClient.post(AUTH_ENDPOINTS.login, {
            email,
            password,
        });
        return response.user;
    }

    async register(
        email: string,
        password: string,
        inviteCode: string
    ): Promise<User> {
        const response = await httpClient.post(AUTH_ENDPOINTS.register, {
            email,
            password,
            inviteCode,
        });
        return response.user;
    }

    async logout(): Promise<void> {
        await httpClient.post(AUTH_ENDPOINTS.logout, {});
    }

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
}

export const authService = new AuthService();
