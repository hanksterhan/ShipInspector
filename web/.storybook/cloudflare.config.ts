import { defineConfig } from "cf/config";

export default defineConfig({
  accountId: "615cf347b166486e8ce9e47a405cf884",
  worker: {
    name: "shipinspector-storybook",
    compatibilityDate: "2026-10-04",
    domains: ["storybook.sipoker.club"],
    workersDev: false,
    previewUrls: false,
    assets: {
      htmlHandling: "auto-trailing-slash",
      notFoundHandling: "none",
    },
  },
});
