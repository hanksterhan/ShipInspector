import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
  server: {
    port: 4000,
  },
  build: {
    outDir: "dist",
  },
});
