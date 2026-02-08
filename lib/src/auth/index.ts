import {
    requireAuth as clerkRequireAuth,
    getAuth,
    clerkClient,
} from "@clerk/express";

// Re-export Clerk functions for use in handlers
export { getAuth, clerkClient };

/**
 * Clerk's requireAuth middleware - use this on all protected routes
 * This ensures the user is authenticated via Clerk
 */
export const requireAuth = clerkRequireAuth;
