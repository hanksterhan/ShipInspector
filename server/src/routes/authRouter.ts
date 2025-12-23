import { IRouter, Router as defineRouter } from "express";
import { authHandler } from "../handlers";
import { authRateLimiter, authenticateSession } from "../middlewares";

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
     * /auth/login:
     *   post:
     *     tags:
     *       - Authentication
     *     summary: Login and create session
     *     description: Authenticates a user and creates a session cookie
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 example: "admin@example.com"
     *               password:
     *                 type: string
     *                 example: "admin123"
     *     responses:
     *       '200':
     *         description: Login successful
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
     *                       example: "1"
     *                     email:
     *                       type: string
     *                       example: "admin@example.com"
     *       '400':
     *         description: Bad request (missing username or password)
     *       '401':
     *         description: Invalid credentials
     *       '429':
     *         description: Too many authentication attempts
     */
    router.post("/auth/login", authRateLimiter, authHandler.login);

    /**
     * @swagger
     * /auth/register:
     *   post:
     *     tags:
     *       - Authentication
     *     summary: Register a new user
     *     description: Creates a new user account and creates a session cookie
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 example: "user@example.com"
     *               password:
     *                 type: string
     *                 example: "password123"
     *                 minLength: 6
     *     responses:
     *       '201':
     *         description: User created successfully
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
     *       '400':
     *         description: Bad request (invalid input)
     *       '409':
     *         description: Username already exists
     *       '429':
     *         description: Too many requests
     */
    router.post("/auth/register", authRateLimiter, authHandler.register);

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
    router.get("/auth/me", authenticateSession, authHandler.getCurrentUser);

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
    router.get("/admin/auth/me", authenticateSession, authHandler.getCurrentAdminUser);

    /**
     * @swagger
     * /auth/logout:
     *   post:
     *     tags:
     *       - Authentication
     *     summary: Logout and destroy session
     *     description: Logs out the current user and destroys their session
     *     responses:
     *       '200':
     *         description: Logged out successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Logged out successfully"
     *       '500':
     *         description: Failed to logout
     */
    router.post("/auth/logout", authHandler.logout);

    return router;
}

export const authRouter = createRouter();
