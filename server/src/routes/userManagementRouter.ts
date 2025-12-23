import { IRouter, Router as defineRouter } from "express";
import { userManagementHandler } from "../handlers/userManagementHandler";
import { requireAdmin, authenticateSession } from "../middlewares/auth";

/**
 * @swagger
 * tags:
 *   - name: User Management
 *     description: User management endpoints (admin only)
 */

function createRouter(): IRouter {
    const router = defineRouter();

    /**
     * @swagger
     * /admin/users:
     *   get:
     *     tags:
     *       - User Management
     *     summary: Get all users (admin only)
     *     description: Returns a list of all users in the system
     *     security:
     *       - sessionAuth: []
     *     responses:
     *       '200':
     *         description: List of users
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 users:
     *                   type: array
     *                   items:
     *                     type: object
     *                 total:
     *                   type: number
     *       '401':
     *         description: Not authenticated
     *       '403':
     *         description: Admin access required
     */
    router.get(
        "/admin/users",
        authenticateSession,
        requireAdmin,
        userManagementHandler.getAllUsers
    );

    /**
     * @swagger
     * /admin/users/role/{role}:
     *   get:
     *     tags:
     *       - User Management
     *     summary: Get users by role (admin only)
     *     description: Returns users filtered by role
     *     security:
     *       - sessionAuth: []
     *     parameters:
     *       - in: path
     *         name: role
     *         required: true
     *         schema:
     *           type: string
     *           enum: [user, admin, moderator]
     *     responses:
     *       '200':
     *         description: List of users with specified role
     *       '400':
     *         description: Invalid role
     *       '401':
     *         description: Not authenticated
     *       '403':
     *         description: Admin access required
     */
    router.get(
        "/admin/users/role/:role",
        authenticateSession,
        requireAdmin,
        userManagementHandler.getUsersByRole
    );

    /**
     * @swagger
     * /admin/users/{userId}:
     *   get:
     *     tags:
     *       - User Management
     *     summary: Get user by ID (admin only)
     *     description: Returns user information by user ID
     *     security:
     *       - sessionAuth: []
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: User information
     *       '404':
     *         description: User not found
     *       '401':
     *         description: Not authenticated
     *       '403':
     *         description: Admin access required
     */
    router.get(
        "/admin/users/:userId",
        authenticateSession,
        requireAdmin,
        userManagementHandler.getUserById
    );

    /**
     * @swagger
     * /admin/users/{userId}/role:
     *   put:
     *     tags:
     *       - User Management
     *     summary: Update user role (admin only)
     *     description: Updates a user's role. Admins cannot demote themselves.
     *     security:
     *       - sessionAuth: []
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - role
     *             properties:
     *               role:
     *                 type: string
     *                 enum: [user, admin, moderator]
     *     responses:
     *       '200':
     *         description: User role updated successfully
     *       '400':
     *         description: Invalid role or cannot demote yourself
     *       '404':
     *         description: User not found
     *       '401':
     *         description: Not authenticated
     *       '403':
     *         description: Admin access required
     */
    router.put(
        "/admin/users/:userId/role",
        authenticateSession,
        requireAdmin,
        userManagementHandler.updateUserRole
    );

    return router;
}

export const userManagementRouter = createRouter();
