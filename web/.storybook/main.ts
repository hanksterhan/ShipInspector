import type { StorybookConfig } from "@storybook/react-vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
  staticDirs: ["../public", "./public"],
  core: { disableTelemetry: true },
  async viteFinal(config) {
    config.define = { ...config.define, "import.meta.env.VITE_API_URL": JSON.stringify("") };
    const aliases = config.resolve?.alias ?? [];
    config.resolve = {
      ...config.resolve,
      alias: [
        { find: "@clerk/clerk-react", replacement: path.join(webRoot, "src/storybook/mocks/clerk.tsx") },
        { find: "idb-keyval", replacement: path.join(webRoot, "src/storybook/mocks/storage.ts") },
        ...(Array.isArray(aliases) ? aliases : Object.entries(aliases).map(([find, replacement]) => ({ find, replacement }))),
      ],
    };
    return config;
  },
};
export default config;
