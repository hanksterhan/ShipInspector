import Clerk from "@clerk/clerk-js";

/**
 * Clerk Service - Handles Clerk initialization and authentication
 */
class ClerkService {
    private clerk: any = null;
    private initPromise: Promise<any> | null = null;

    /**
     * Initialize Clerk with publishable key
     * Should be called once at app startup
     */
    async initialize(): Promise<any> {
        // Return existing instance if already initialized
        if (this.clerk) {
            return this.clerk;
        }

        // Return existing promise if initialization is in progress
        if (this.initPromise) {
            return this.initPromise;
        }

        // Start initialization
        this.initPromise = (async () => {
            // Get publishable key from window/process environment
            const publishableKey = (window as any).ENV?.VITE_CLERK_PUBLISHABLE_KEY || 
                                   process.env.VITE_CLERK_PUBLISHABLE_KEY;

            if (!publishableKey) {
                throw new Error(
                    "Missing VITE_CLERK_PUBLISHABLE_KEY environment variable"
                );
            }

            // @ts-ignore - Clerk default export
            this.clerk = new Clerk.default(publishableKey);
            await this.clerk.load();
            return this.clerk;
        })();

        return this.initPromise;
    }

    /**
     * Get the Clerk instance
     * Throws if not initialized
     */
    getClerk(): any {
        if (!this.clerk) {
            throw new Error(
                "Clerk not initialized. Call initialize() first."
            );
        }
        return this.clerk;
    }

    /**
     * Check if Clerk is initialized
     */
    isInitialized(): boolean {
        return this.clerk !== null;
    }

    /**
     * Get the current user's session token
     */
    async getToken(): Promise<string | null> {
        try {
            const clerk = this.getClerk();
            return await clerk.session?.getToken();
        } catch {
            return null;
        }
    }
}

export const clerkService = new ClerkService();

