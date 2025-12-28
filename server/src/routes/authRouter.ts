import { IRouter, Router as defineRouter } from "express";
import { authHandler } from "../handlers";
import {
    requireAdmin,
    requireAuth,
} from "../middlewares";

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and token management
 */

function createRouter(): IRouter {
    const router = defineRouter();

    /**
     * @swagger
     * /auth/me:
     *   get:
     *     tags:
     *       - Authentication
     *     summary: Get current user information
     *     description: Returns information about the currently authenticated user
     *     responses:
     *       '200':
     *         description: User information retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 user:
     *                   type: object
     *                   properties:
     *                     userId:
     *                       type: string
     *                     email:
     *                       type: string
     *       '401':
     *         description: Not authenticated
     */
    router.get("/auth/me", requireAuth(), authHandler.getCurrentUser);

    /**
     * @swagger
     * /admin/auth/me:
     *   get:
     *     tags:
     *       - Authentication
     *     summary: Get current admin user information
     *     description: Returns information about the currently authenticated admin user (admin app only)
     *     security:
     *       - sessionAuth: []
     *     responses:
     *       '200':
     *         description: Admin user information retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 user:
     *                   type: object
     *                   properties:
     *                     userId:
     *                       type: string
     *                     email:
     *                       type: string
     *                     role:
     *                       type: string
     *                       example: "admin"
     *       '401':
     *         description: Not authenticated
     *       '403':
     *         description: Admin access required
     */
    router.get(
        "/admin/auth/me",
        requireAuth(),
        requireAdmin,
        authHandler.getCurrentAdminUser
    );

    /**
     * @swagger
     * /auth/clerk-user:
     *   get:
     *     tags:
     *       - Authentication
     *     summary: Get Clerk user information (example protected route)
     *     description: Example route demonstrating Clerk's requireAuth() middleware. Returns user information from Clerk.
     *     security:
     *       - clerkAuth: []
     *     responses:
     *       '200':
     *         description: Clerk user information retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 user:
     *                   type: object
     *                   description: Clerk user object
     *       '401':
     *         description: Not authenticated
     */
    router.get("/auth/clerk-user", requireAuth(), authHandler.getClerkUserInfo);

    return router;
}

export const authRouter = createRouter();
