import type { StorybookConfig } from "@storybook/react-vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const webRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.stories.tsx"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  staticDirs: ["./public"],
  core: { disableTelemetry: true },
  async viteFinal(config) {
    config.publicDir = false;
    const deps = JSON.parse(
      readFileSync(path.join(webRoot, "package.json"), "utf8"),
    ).dependencies;
    const radix = Object.keys(deps).filter(
      (name) => name === "radix-ui" || name.startsWith("@radix-ui/"),
    );
    config.optimizeDeps = {
      ...config.optimizeDeps,
      include: [
        ...new Set([
          ...(config.optimizeDeps?.include ?? []),
          ...radix,
          "react-router-dom",
          "zustand",
          "zustand/middleware",
          "storybook/viewport",
        ]),
      ],
    };
    config.define = {
      ...config.define,
      "import.meta.env.VITE_API_URL": JSON.stringify(""),
      "import.meta.env.STORYBOOK_A11Y_AUDIT": JSON.stringify(
        process.env.STORYBOOK_A11Y_AUDIT === "1",
      ),
    };
    const aliases = config.resolve?.alias ?? [];
    config.resolve = {
      ...config.resolve,
      alias: [
        {
          find: "@clerk/clerk-react",
          replacement: path.join(webRoot, "src/storybook/mocks/clerk.tsx"),
        },
        {
          find: "idb-keyval",
          replacement: path.join(webRoot, "src/storybook/mocks/storage.ts"),
        },
        ...(Array.isArray(aliases)
          ? aliases
          : Object.entries(aliases).map(([find, replacement]) => ({
              find,
              replacement,
            }))),
      ],
    };
    return config;
  },
};
export default config;
