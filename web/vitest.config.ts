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
    exclude: ["e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov"],
      include: ["src/stores/**", "src/lib/**", "src/services/**", "src/hooks/**"],
      exclude: ["src/**/*.test.*", "src/test/**"],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
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
