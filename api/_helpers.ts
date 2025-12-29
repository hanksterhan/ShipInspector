/**
 * Helper to register path aliases at runtime for Vercel serverless functions
 * This must be imported before any code that uses @common/* imports
 * 
 * Vercel compiles TypeScript automatically but doesn't resolve path aliases.
 * This runtime resolver ensures @common/* imports work at runtime.
 */
try {
    const { register } = require("tsconfig-paths");
    const path = require("path");
    const fs = require("fs");
    
    const baseUrl = path.resolve(__dirname, "..");
    
    // Check if common source or dist exists
    const commonSrc = path.join(baseUrl, "common", "src");
    const commonDist = path.join(baseUrl, "common", "dist", "common", "src");
    
    // Build paths array - prefer source if it exists, otherwise use dist
    const commonPaths: string[] = [];
    if (fs.existsSync(commonSrc)) {
        commonPaths.push("common/src/*");
    }
    if (fs.existsSync(commonDist)) {
        commonPaths.push("common/dist/common/src/*");
    }
    // Fallback to source path (for TypeScript compilation)
    if (commonPaths.length === 0) {
        commonPaths.push("common/src/*");
    }
    
    // Register path aliases for runtime resolution
    register({
        baseUrl: baseUrl,
        paths: {
            "@common/*": commonPaths,
        },
    });
    
    console.log(`[Path Resolver] Registered @common/* paths: ${commonPaths.join(", ")}`);
} catch (error: any) {
    // If tsconfig-paths fails, log warning but continue
    // The build process should have resolved paths, but if not, imports will fail
    console.warn("[Path Resolver] Could not register tsconfig-paths:", error.message);
    console.warn("[Path Resolver] Make sure common package is built and accessible");
}

