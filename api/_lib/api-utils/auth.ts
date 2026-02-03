import { VercelRequest } from "@vercel/node";
import { getAuth as clerkGetAuth, clerkClient } from "@clerk/express";

/**
 * Get authentication info from Vercel request
 * Adapts Clerk's getAuth to work with VercelRequest
 */
export function getAuth(req: VercelRequest) {
    // Clerk's getAuth expects Express Request, but VercelRequest is compatible
    return clerkGetAuth(req as any);
}

/**
 * Re-export clerkClient for use in handlers
 */
export { clerkClient };

/**
 * Check if user is authenticated
 */
export function requireAuth(req: VercelRequest): { userId: string } {
    const { userId } = getAuth(req);
    if (!userId) {
        throw new Error("Not authenticated");
    }
    return { userId };
}

