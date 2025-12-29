import { makeObservable, observable, action, runInAction } from "mobx";
import { clerkService } from "../../services/clerkService";
import { authService } from "../../services/authService";

export interface User {
    userId: string;
    email: string;
    role?: string;
    clerkData?: {
        firstName?: string | null;
        lastName?: string | null;
        imageUrl?: string;
    };
}

/**
 * AuthStore - Uses Clerk for authentication
 *
 * Authentication is checked in these circumstances only:
 * 1. On app startup / initial render (to determine if user is already logged in)
 * 2. When Clerk emits an auth change event (login/logout via clerk.addListener)
 * 3. When user performs auth-sensitive actions (token automatically included in HTTP requests)
 *
 * Note: Authentication is NOT checked on route changes to avoid unnecessary server calls.
 * The server validates the token on each API request automatically.
 */
export class AuthStore {
    @observable
    user: User | null = null;

    @observable
    isLoading = true; // Start as true to show loading state initially

    @observable
    error: string | null = null;

    @observable
    isClerkLoaded = false;

    constructor() {
        makeObservable(this);
        // 1. Initialize Clerk and perform initial auth check (app startup)
        this.initializeClerk();
    }

    @action
    private async initializeClerk(): Promise<void> {
        try {
            await clerkService.initialize();
            runInAction(() => {
                this.isClerkLoaded = true;
            });

            // 2. Listen to Clerk session changes (auth events - login/logout)
            const clerk = clerkService.getClerk();
            clerk.addListener((event: any) => {
                // Only react to actual session changes, not all client events
                if (event.session !== undefined) {
                    this.checkAuth();
                }
            });

            // 1. Initial auth check on startup (to determine if user is already logged in)
            await this.checkAuth();
        } catch (error: any) {
            console.error("Failed to initialize Clerk:", error);
            runInAction(() => {
                this.error = "Failed to initialize authentication";
                this.isLoading = false;
                this.isClerkLoaded = false;
            });
        }
    }

    @action
    async checkAuth(): Promise<void> {
        this.isLoading = true;
        this.error = null;

        try {
            const clerk = clerkService.getClerk();

            // Check if user is signed in with Clerk
            if (!clerk.user) {
                runInAction(() => {
                    this.user = null;
                    this.isLoading = false;
                });
                return;
            }

            // Get user info from backend (includes role)
            const user = await authService.getCurrentUser();
            runInAction(() => {
                this.user = user;
                this.isLoading = false;
            });
        } catch (error: any) {
            // Silently handle authentication errors (401) - user is just not logged in
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
    async logout(): Promise<void> {
        this.isLoading = true;
        this.error = null;
        try {
            await authService.logout();
            runInAction(() => {
                this.user = null;
                this.isLoading = false;
            });
            // Navigate to sign-in page after logout
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
        return this.user !== null;
    }
}
