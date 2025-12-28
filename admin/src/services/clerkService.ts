import * as ClerkModule from "@clerk/clerk-js";

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
            // Get publishable key from environment (injected by webpack)
            // @ts-ignore - process.env is replaced at build time by webpack
            const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;

            if (!publishableKey) {
                throw new Error(
                    "Missing VITE_CLERK_PUBLISHABLE_KEY environment variable. " +
                    "Make sure you have a .env file with VITE_CLERK_PUBLISHABLE_KEY set."
                );
            }

            // Handle different module formats (ESM vs CommonJS)
            // Try: default export, named Clerk export, or the module itself
            // @ts-ignore
            const ClerkConstructor = ClerkModule.default || ClerkModule.Clerk || ClerkModule;
            
            if (typeof ClerkConstructor !== 'function') {
                throw new Error(
                    "Failed to load Clerk constructor. Check that @clerk/clerk-js is properly installed. " +
                    "Available keys: " + Object.keys(ClerkModule).join(', ')
                );
            }

            this.clerk = new ClerkConstructor(publishableKey);
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

