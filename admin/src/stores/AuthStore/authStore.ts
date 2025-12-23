import { makeObservable, observable, action, runInAction } from "mobx";
import { authService } from "../../services/authService";

export interface User {
    userId: string;
    email: string;
    role: string;
}

export class AuthStore {
    @observable
    user: User | null = null;

    @observable
    isLoading = true; // Start as true to show loading state initially

    @observable
    error: string | null = null;

    constructor() {
        makeObservable(this);
        // Check for existing session on initialization
        this.checkAuth();
    }

    @action
    async checkAuth(): Promise<void> {
        this.isLoading = true;
        this.error = null;
        try {
            const user = await authService.getCurrentUser();
            // Only allow admin users in the admin app
            if (user.role !== "admin") {
                // Clear session for non-admin users
                await authService.logout();
                runInAction(() => {
                    this.user = null;
                    this.isLoading = false;
                    this.error = "Admin access required";
                });
                return;
            }
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
            // Only allow admin users in the admin app
            if (user.role !== "admin") {
                // Logout non-admin users immediately
                await authService.logout();
                runInAction(() => {
                    this.user = null;
                    this.isLoading = false;
                    this.error = "Admin access required. This application is only available to administrators.";
                });
                return;
            }
            runInAction(() => {
                this.user = user;
                this.isLoading = false;
            });
            // Navigate to main app after successful login
            import("../index").then(({ routerStore }) => {
                routerStore.navigate("/invite-management");
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
            // Only allow admin users in the admin app
            if (user.role !== "admin") {
                // Logout non-admin users immediately
                await authService.logout();
                runInAction(() => {
                    this.user = null;
                    this.isLoading = false;
                    this.error = "Admin access required. This application is only available to administrators.";
                });
                return;
            }
            runInAction(() => {
                this.user = user;
                this.isLoading = false;
            });
            // Navigate to main app after successful registration
            import("../index").then(({ routerStore }) => {
                routerStore.navigate("/invite-management");
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
        return this.user !== null && this.user.role === "admin";
    }
}
