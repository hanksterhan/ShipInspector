import { IRouter, Router as defineRouter } from "express";
import { inviteCodeHandler } from "../handlers/inviteCodeHandler";
import { requireAdmin, authenticateSession } from "../middlewares/auth";

/**
 * @swagger
 * tags:
 *   - name: Invite Codes
 *     description: Invite code management (admin only)
 */

function createRouter(): IRouter {
    const router = defineRouter();

    /**
     * @swagger
     * /invite-codes:
     *   post:
     *     tags:
     *       - Invite Codes
     *     summary: Create a new invite code (admin only)
     *     description: Generates a new alphanumeric invite code
     *     security:
     *       - sessionAuth: []
     *     responses:
     *       '201':
     *         description: Invite code created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 code:
     *                   type: string
     *                   example: "ABC12345"
     *                 message:
     *                   type: string
     *       '401':
     *         description: Not authenticated
     *       '403':
     *         description: Admin access required
     */
    router.post(
        "/invite-codes",
        authenticateSession,
        requireAdmin,
        inviteCodeHandler.createInviteCode
    );

    /**
     * @swagger
     * /invite-codes:
     *   get:
     *     tags:
     *       - Invite Codes
     *     summary: Get all invite codes (admin only)
     *     description: Returns all invite codes with their usage status
     *     security:
     *       - sessionAuth: []
     *     responses:
     *       '200':
     *         description: List of invite codes
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 inviteCodes:
     *                   type: array
     *                   items:
     *                     type: object
     *                 total:
     *                   type: number
     *                 used:
     *                   type: number
     *                 unused:
     *                   type: number
     *       '401':
     *         description: Not authenticated
     *       '403':
     *         description: Admin access required
     */
    router.get(
        "/invite-codes",
        authenticateSession,
        requireAdmin,
        inviteCodeHandler.getAllInviteCodes
    );

    /**
     * @swagger
     * /invite-codes/unused:
     *   get:
     *     tags:
     *       - Invite Codes
     *     summary: Get unused invite codes (admin only)
     *     description: Returns all unused invite codes
     *     security:
     *       - sessionAuth: []
     *     responses:
     *       '200':
     *         description: List of unused invite codes
     *       '401':
     *         description: Not authenticated
     *       '403':
     *         description: Admin access required
     */
    router.get(
        "/invite-codes/unused",
        authenticateSession,
        requireAdmin,
        inviteCodeHandler.getUnusedInviteCodes
    );

    /**
     * @swagger
     * /invite-codes/used:
     *   get:
     *     tags:
     *       - Invite Codes
     *     summary: Get used invite codes (admin only)
     *     description: Returns all used invite codes with usage information
     *     security:
     *       - sessionAuth: []
     *     responses:
     *       '200':
     *         description: List of used invite codes
     *       '401':
     *         description: Not authenticated
     *       '403':
     *         description: Admin access required
     */
    router.get(
        "/invite-codes/used",
        authenticateSession,
        requireAdmin,
        inviteCodeHandler.getUsedInviteCodes
    );

    return router;
}

export const inviteCodeRouter = createRouter();
