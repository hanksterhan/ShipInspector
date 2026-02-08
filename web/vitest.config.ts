import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@common/interfaces": path.resolve(
        __dirname,
        "../common/src/interfaces"
      ),
      "@common": path.resolve(__dirname, "../common"),
    },
  },
});
