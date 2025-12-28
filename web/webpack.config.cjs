const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
require("dotenv").config();

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
            "@common": path.resolve(__dirname, "../common/"),
        },
        fullySpecified: false,
    },
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist"),
        clean: true,
    },
    plugins: [
        new MiniCssExtractPlugin(),
        new webpack.DefinePlugin({
            "process.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(
                process.env.VITE_CLERK_PUBLISHABLE_KEY || ""
            ),
            "process.env.API_URL": JSON.stringify(
                process.env.API_URL || "http://localhost:3000"
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
        new webpack.DefinePlugin({
            "process.env.API_URL": JSON.stringify(
                process.env.API_URL || "http://localhost:3000"
            ),
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
