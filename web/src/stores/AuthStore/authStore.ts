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

    // Track previous user ID to detect actual sign in/out events, not periodic updates
    private previousUserId: string | null = null;

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

            // 2. Listen to Clerk session changes (auth events - login/logout only)
            const clerk = clerkService.getClerk();

            clerk.addListener((event: any) => {
                // Only react to actual authentication state changes (sign in/out), not periodic session updates
                // Check if the user ID has actually changed, indicating a sign in or sign out
                const currentUserId = clerk.user?.id || null;

                // Only trigger checkAuth if the user authentication state actually changed
                // This prevents periodic session refresh events from causing page reloads
                if (this.previousUserId !== currentUserId) {
                    this.previousUserId = currentUserId;
                    this.checkAuth();
                }
            });

            // Set initial user ID for comparison
            this.previousUserId = clerk.user?.id || null;

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
    async checkAuth(skipLoadingState = false): Promise<void> {
        // Only set loading state if this is the initial check or if explicitly requested
        // This prevents periodic session updates from causing page reloads
        if (!skipLoadingState) {
            this.isLoading = true;
        }
        this.error = null;

        try {
            const clerk = clerkService.getClerk();

            // Check if user is signed in with Clerk
            if (!clerk.user) {
                runInAction(() => {
                    this.user = null;
                    this.previousUserId = null;
                    this.isLoading = false;
                });
                return;
            }

            // Get user info from backend (includes role)
            const user = await authService.getCurrentUser();
            runInAction(() => {
                this.user = user;
                // Update previousUserId to keep it in sync
                this.previousUserId = clerk.user?.id || null;
                this.isLoading = false;
            });
        } catch (error: any) {
            // Silently handle authentication errors (401) - user is just not logged in
            runInAction(() => {
                this.user = null;
                this.previousUserId = null;
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
