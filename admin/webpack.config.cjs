const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
require("dotenv").config();

module.exports = {
    mode: "development",
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
        fallback: {
            "stream": false,
            "buffer": false,
        },
        fullySpecified: false,
    },
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist"),
    },
    plugins: [
        new MiniCssExtractPlugin(),
        new webpack.DefinePlugin({
            "process.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(
                process.env.VITE_CLERK_PUBLISHABLE_KEY
            ),
        }),
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, "public"),
        },
        compress: true,
        port: 4040,
        historyApiFallback: true,
        open: false,
    },
};
