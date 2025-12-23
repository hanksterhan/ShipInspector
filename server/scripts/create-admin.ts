/**
 * Admin User Creation Script
 * 
 * This script creates an initial admin user in the database.
 * Run this manually after setting up your .env file.
 * 
 * Usage:
 *   npm run create-admin
 *   or
 *   ts-node server/scripts/create-admin.ts
 * 
 * Required .env variables:
 *   ADMIN_EMAIL=admin@example.com
 *   ADMIN_PASSWORD=your-secure-password
 */

import dotenv from "dotenv";
import path from "path";

// Load environment variables
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

// Import after dotenv is configured
import db from "../src/config/database";
import bcrypt from "bcryptjs";
import { userExists } from "../src/services/userService";

async function createAdminUser() {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail) {
        console.error("❌ ERROR: ADMIN_EMAIL is not set in .env file");
        console.error("   Please set ADMIN_EMAIL=your-email@example.com in your .env file");
        process.exit(1);
    }

    if (!adminPassword) {
        console.error("❌ ERROR: ADMIN_PASSWORD is not set in .env file");
        console.error("   Please set ADMIN_PASSWORD=your-secure-password in your .env file");
        process.exit(1);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
        console.error(`❌ ERROR: Invalid email format: ${adminEmail}`);
        process.exit(1);
    }

    // Validate password strength
    if (adminPassword.length < 8) {
        console.error("❌ ERROR: Password must be at least 8 characters long");
        process.exit(1);
    }

    // Check if admin user already exists
    if (userExists(adminEmail)) {
        console.log(`⚠️  Admin user ${adminEmail} already exists in database`);
        console.log("   If you want to reset the password, delete the user first or use a different email");
        process.exit(0);
    }

    try {
        // Hash password
        const passwordHash = await bcrypt.hash(adminPassword, 10);

        // Generate user ID
        const userId = `admin_${Date.now()}`;
        const createdAt = Date.now();

        // Insert admin user into database
        db.prepare(
            `INSERT INTO users (user_id, email, password_hash, role, created_at)
             VALUES (?, ?, ?, 'admin', ?)`
        ).run(userId, adminEmail.toLowerCase(), passwordHash, createdAt);

        console.log("✅ Admin user created successfully!");
        console.log(`   Email: ${adminEmail}`);
        console.log(`   User ID: ${userId}`);
        console.log(`   Role: admin`);
        console.log("\n⚠️  IMPORTANT: Keep your .env file secure and never commit it to version control!");
    } catch (error: any) {
        if (error.message?.includes("UNIQUE constraint")) {
            console.log(`⚠️  Admin user ${adminEmail} already exists in database`);
        } else {
            console.error("❌ ERROR: Failed to create admin user:", error.message);
            process.exit(1);
        }
    }
}

// Run the script
createAdminUser()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Fatal error:", error);
        process.exit(1);
    });

