import { Request, Response } from "express";
import { getAuth, clerkClient } from "../middlewares/auth";
import {
    createInviteCode,
    getAllInviteCodes,
    getUnusedInviteCodes,
    getUsedInviteCodes,
    deleteInviteCode,
} from "../services/inviteCodeService";

/**
 * Create a new invite code (admin only)
 * Uses Clerk authentication
 */
export async function createInviteCodeHandler(req: Request, res: Response): Promise<void> {
    try {
        // Use Clerk's getAuth to get the user's userId
        const { userId } = getAuth(req);

        if (!userId) {
            res.status(401).json({
                error: "Authentication required",
            });
            return;
        }

        // Get Clerk user to get email
        const clerkUser = await clerkClient.users.getUser(userId);
        const createdBy = clerkUser.emailAddresses[0]?.emailAddress || "system";

        const code = await createInviteCode(createdBy);

        res.status(201).json({
            code,
            message: "Invite code created successfully",
        });
    } catch (error: any) {
        console.error("Create invite code error:", error);
        res.status(500).json({
            error: "Failed to create invite code",
        });
    }
}

/**
 * Get all invite codes (admin only)
 */
export async function getAllInviteCodesHandler(req: Request, res: Response): Promise<void> {
    try {
        const codes = await getAllInviteCodes();

        res.json({
            inviteCodes: codes,
            total: codes.length,
            used: codes.filter((c) => c.used).length,
            unused: codes.filter((c) => !c.used).length,
        });
    } catch (error: any) {
        console.error("Get invite codes error:", error);
        res.status(500).json({
            error: "Failed to retrieve invite codes",
        });
    }
}

/**
 * Get unused invite codes (admin only)
 */
export async function getUnusedInviteCodesHandler(req: Request, res: Response): Promise<void> {
    try {
        const codes = await getUnusedInviteCodes();

        res.json({
            inviteCodes: codes,
            total: codes.length,
        });
    } catch (error: any) {
        console.error("Get unused invite codes error:", error);
        res.status(500).json({
            error: "Failed to retrieve unused invite codes",
        });
    }
}

/**
 * Get used invite codes (admin only)
 */
export async function getUsedInviteCodesHandler(req: Request, res: Response): Promise<void> {
    try {
        const codes = await getUsedInviteCodes();

        res.json({
            inviteCodes: codes,
            total: codes.length,
        });
    } catch (error: any) {
        console.error("Get used invite codes error:", error);
        res.status(500).json({
            error: "Failed to retrieve used invite codes",
        });
    }
}

/**
 * Delete an invite code (admin only)
 */
export async function deleteInviteCodeHandler(req: Request, res: Response): Promise<void> {
    try {
        const { code } = req.params;

        if (!code) {
            res.status(400).json({
                error: "Invite code is required",
            });
            return;
        }

        const deleted = await deleteInviteCode(code);

        if (!deleted) {
            res.status(404).json({
                error: "Invite code not found",
            });
            return;
        }

        res.json({
            message: "Invite code deleted successfully",
        });
    } catch (error: any) {
        console.error("Delete invite code error:", error);
        res.status(500).json({
            error: "Failed to delete invite code",
        });
    }
}

export const inviteCodeHandler = {
    createInviteCode: createInviteCodeHandler,
    getAllInviteCodes: getAllInviteCodesHandler,
    getUnusedInviteCodes: getUnusedInviteCodesHandler,
    getUsedInviteCodes: getUsedInviteCodesHandler,
    deleteInviteCode: deleteInviteCodeHandler,
};
