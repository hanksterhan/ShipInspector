import { makeObservable, observable, action, runInAction } from "mobx";
import { authService } from "../../services/authService";

export interface User {
    userId: string;
    email: string;
}

export class AuthStore {
    @observable
    user: User | null = {
        userId: "disabled-auth",
        email: "disabled@example.com",
    }; // Set default user - auth disabled

    @observable
    isLoading = false; // Start as false - auth disabled

    @observable
    error: string | null = null;

    constructor() {
        makeObservable(this);
        // Auth disabled - skip checkAuth
        // this.checkAuth();
    }

    @action
    async checkAuth(): Promise<void> {
        this.isLoading = true;
        this.error = null;
        try {
            const user = await authService.getCurrentUser();
            runInAction(() => {
                this.user = user;
                this.isLoading = false;
            });
        } catch (error: any) {
            // Silently handle authentication errors (401) - user is just not logged in
            // This is expected behavior, not an actual error
            runInAction(() => {
                this.user = null;
                this.isLoading = false;
                // Only set error if it's not a 401 (authentication required)
                if (error.status !== 401 && !error.isAuthError) {
                    this.error =
                        error.message || "Failed to check authentication";
                }
            });
        }
    }

    @action
    async login(email: string, password: string): Promise<void> {
        this.isLoading = true;
        this.error = null;
        try {
            const user = await authService.login(email, password);
            runInAction(() => {
                this.user = user;
                this.isLoading = false;
            });
            // Navigate to main app after successful login
            import("../index").then(({ routerStore }) => {
                routerStore.navigate("/poker-hands");
            });
        } catch (error: any) {
            runInAction(() => {
                this.error = error.message || "Login failed";
                this.isLoading = false;
                this.user = null;
            });
            throw error;
        }
    }

    @action
    async register(
        email: string,
        password: string,
        inviteCode: string
    ): Promise<void> {
        this.isLoading = true;
        this.error = null;
        try {
            const user = await authService.register(
                email,
                password,
                inviteCode
            );
            runInAction(() => {
                this.user = user;
                this.isLoading = false;
            });
            // Navigate to main app after successful registration
            import("../index").then(({ routerStore }) => {
                routerStore.navigate("/poker-hands");
            });
        } catch (error: any) {
            runInAction(() => {
                this.error = error.message || "Registration failed";
                this.isLoading = false;
                this.user = null;
            });
            throw error;
        }
    }

    @action
    async logout(): Promise<void> {
        this.isLoading = true;
        this.error = null;
        try {
            await authService.logout();
            runInAction(() => {
                this.user = null;
                this.isLoading = false;
            });
            // Navigate to login page after logout
            import("../index").then(({ routerStore }) => {
                routerStore.navigate("/");
            });
        } catch (error: any) {
            runInAction(() => {
                this.error = error.message || "Logout failed";
                this.isLoading = false;
            });
        }
    }

    @action
    clearError(): void {
        this.error = null;
    }

    get isAuthenticated(): boolean {
        // Auth disabled - always return true
        return true;
    }
}
