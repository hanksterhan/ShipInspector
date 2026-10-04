import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { webRoot } from "./source-inventory.mjs";

const require = createRequire(import.meta.url);
const source = path.join(
  path.dirname(require.resolve("msw/package.json")),
  "lib/mockServiceWorker.js",
);
const output = path.join(webRoot, ".storybook/public");
fs.mkdirSync(output, { recursive: true });
// Keep the app's fallback index out of Storybook's manager entry point.
fs.cpSync(path.join(webRoot, "public"), output, {
  recursive: true,
  filter: (file) => path.basename(file) !== "index.html",
});
fs.copyFileSync(source, path.join(output, "mockServiceWorker.js"));
