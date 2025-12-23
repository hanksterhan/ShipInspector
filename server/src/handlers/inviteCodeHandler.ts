import { Request, Response } from "express";
import {
    createInviteCode,
    getAllInviteCodes,
    getUnusedInviteCodes,
    getUsedInviteCodes,
} from "../services/inviteCodeService";

/**
 * Create a new invite code (admin only)
 */
export function createInviteCodeHandler(req: Request, res: Response): void {
    try {
        const session = req.session as any;
        const createdBy = session.email || "system";

        const code = createInviteCode(createdBy);

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
export function getAllInviteCodesHandler(req: Request, res: Response): void {
    try {
        const codes = getAllInviteCodes();

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
export function getUnusedInviteCodesHandler(req: Request, res: Response): void {
    try {
        const codes = getUnusedInviteCodes();

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
export function getUsedInviteCodesHandler(req: Request, res: Response): void {
    try {
        const codes = getUsedInviteCodes();

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

export const inviteCodeHandler = {
    createInviteCode: createInviteCodeHandler,
    getAllInviteCodes: getAllInviteCodesHandler,
    getUnusedInviteCodes: getUnusedInviteCodesHandler,
    getUsedInviteCodes: getUsedInviteCodesHandler,
};
