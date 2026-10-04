import type {} from "@vitest/browser/providers/playwright";
import { defineConfig, mergeConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [storybookTest({ configDir: ".storybook" })],
    test: {
      name: "storybook",
      browser: {
        enabled: true,
        headless: true,
        provider: "playwright",
        instances: [
          {
            browser: "chromium",
            ...(process.env.STORYBOOK_REDUCED_MOTION === "1"
              ? { context: { reducedMotion: "reduce" as const } }
              : {}),
          },
        ],
      },
    },
  }),
);
