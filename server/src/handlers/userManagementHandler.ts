import { Request, Response } from "express";
import { getAuth } from "../middlewares/auth";
import {
    getAllUsers,
    getUsersByRole,
    updateUserRole,
    getUserById,
    UserRole,
} from "../services/userService";

/**
 * Get all users (admin only)
 */
export async function getAllUsersHandler(req: Request, res: Response): Promise<void> {
    try {
        const users = await getAllUsers();

        // Remove password hashes from response
        const safeUsers = users.map((user) => ({
            userId: user.userId,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));

        res.json({
            users: safeUsers,
            total: safeUsers.length,
        });
    } catch (error: any) {
        console.error("Get all users error:", error);
        res.status(500).json({
            error: "Failed to retrieve users",
        });
    }
}

/**
 * Get users by role (admin only)
 */
export async function getUsersByRoleHandler(req: Request, res: Response): Promise<void> {
    try {
        const role = req.params.role as UserRole;

        // Validate role
        if (!["user", "admin", "moderator"].includes(role)) {
            res.status(400).json({
                error: "Invalid role. Must be 'user', 'admin', or 'moderator'",
            });
            return;
        }

        const users = await getUsersByRole(role);

        // Remove password hashes from response
        const safeUsers = users.map((user) => ({
            userId: user.userId,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));

        res.json({
            users: safeUsers,
            role,
            total: safeUsers.length,
        });
    } catch (error: any) {
        console.error("Get users by role error:", error);
        res.status(500).json({
            error: "Failed to retrieve users",
        });
    }
}

/**
 * Update user role (admin only)
 * Uses Clerk authentication
 */
export async function updateUserRoleHandler(req: Request, res: Response): Promise<void> {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!userId) {
            res.status(400).json({
                error: "User ID is required",
            });
            return;
        }

        if (!role) {
            res.status(400).json({
                error: "Role is required",
            });
            return;
        }

        // Validate role
        if (!["user", "admin", "moderator"].includes(role)) {
            res.status(400).json({
                error: "Invalid role. Must be 'user', 'admin', or 'moderator'",
            });
            return;
        }

        // Check if user exists
        const user = await getUserById(userId);
        if (!user) {
            res.status(404).json({
                error: "User not found",
            });
            return;
        }

        // Prevent admin from demoting themselves (safety check)
        // Use Clerk's getAuth to get the current user's ID
        const { userId: currentUserId } = getAuth(req);
        if (currentUserId === userId && role !== "admin") {
            res.status(400).json({
                error: "Cannot demote yourself from admin role",
            });
            return;
        }

        // Update role
        const updated = await updateUserRole(userId, role as UserRole);
        if (!updated) {
            res.status(500).json({
                error: "Failed to update user role",
            });
            return;
        }

        // Get updated user
        const updatedUser = await getUserById(userId);
        if (!updatedUser) {
            res.status(500).json({
                error: "Failed to retrieve updated user",
            });
            return;
        }

        res.json({
            user: {
                userId: updatedUser.userId,
                email: updatedUser.email,
                role: updatedUser.role,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt,
            },
            message: "User role updated successfully",
        });
    } catch (error: any) {
        console.error("Update user role error:", error);
        res.status(500).json({
            error: "Failed to update user role",
        });
    }
}

/**
 * Get user by ID (admin only)
 */
export async function getUserByIdHandler(req: Request, res: Response): Promise<void> {
    try {
        const { userId } = req.params;

        if (!userId) {
            res.status(400).json({
                error: "User ID is required",
            });
            return;
        }

        const user = await getUserById(userId);
        if (!user) {
            res.status(404).json({
                error: "User not found",
            });
            return;
        }

        // Remove password hash from response
        res.json({
            user: {
                userId: user.userId,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error: any) {
        console.error("Get user by ID error:", error);
        res.status(500).json({
            error: "Failed to retrieve user",
        });
    }
}

export const userManagementHandler = {
    getAllUsers: getAllUsersHandler,
    getUsersByRole: getUsersByRoleHandler,
    updateUserRole: updateUserRoleHandler,
    getUserById: getUserByIdHandler,
};
