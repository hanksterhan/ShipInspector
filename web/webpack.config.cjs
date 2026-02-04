const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
// Load .env file for local development (optional - Vercel uses environment variables directly)
require("dotenv").config();

const vercelEnv = process.env.VERCEL_ENV;
const isPreview = vercelEnv === "preview";
const isVercel = vercelEnv === "preview" || vercelEnv === "production";
const apiUrlDefault = isVercel ? "" : "http://localhost:3000";
const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY;

if (isPreview && !clerkPublishableKey) {
    throw new Error(
        "Missing CLERK_PUBLISHABLE_KEY for Vercel preview build.\n\n" +
        "Required setup:\n" +
        "1. Set CLERK_PUBLISHABLE_KEY in Vercel Dashboard → Settings → Environment Variables (Preview environment)\n" +
        "2. Configure Clerk Dashboard → Paths to allow '*.vercel.app' domains\n" +
        "   See README.md 'Deployment Configuration' section for details.\n"
    );
}

module.exports = {
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    entry: "./src/index.ts",
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: [
                    "lit-css-loader",
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                ],
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".js"],
        alias: {
            "@common/interfaces": path.resolve(__dirname, "../common/src/interfaces"),
            "@common": path.resolve(__dirname, "../common/"),
        },
        fullySpecified: false,
        // Configure export conditions for Spectrum Web Components and Lit
        // In production: use 'production' condition for optimized builds
        // In development: use 'default' to avoid issues with packages that don't support 'development' condition
        // This still allows Spectrum/Lit to use their dev builds via their own internal logic
        conditionNames: process.env.NODE_ENV === "production"
            ? ["production", "default", "import", "require"]
            : ["default", "import", "require"],
    },
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist"),
        clean: true,
    },
    plugins: [
        new MiniCssExtractPlugin(),
        new webpack.DefinePlugin({
            "process.env.CLERK_PUBLISHABLE_KEY": JSON.stringify(
                clerkPublishableKey || ""
            ),
            "process.env.API_URL": JSON.stringify(
                process.env.API_URL || apiUrlDefault
            ),
            "process.env.NODE_ENV": JSON.stringify(
                process.env.NODE_ENV || "development"
            ),
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, "public"),
                    to: path.resolve(__dirname, "dist"),
                },
            ],
        }),
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, "public"),
        },
        compress: true,
        port: 4000,
        historyApiFallback: true,
        open: false,
    },
};
