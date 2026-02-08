import { neon } from "@neondatabase/serverless";

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error(
        "DATABASE_URL environment variable is required for Neon database connection"
    );
}

// Create Neon SQL client
const sql = neon(databaseUrl);

export default sql;
