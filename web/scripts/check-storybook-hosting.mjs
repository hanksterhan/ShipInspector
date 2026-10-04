import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadAndParseConfig } from "@cloudflare/config";
import { Miniflare } from "miniflare";

const webRoot = path.resolve(import.meta.dirname, "..");
const { result } = await loadAndParseConfig(
  path.join(webRoot, ".storybook/cloudflare.config.ts"),
  { isPreview: false },
);
if (!result.success)
  throw new Error(`Invalid Cloudflare config: ${result.error}`);
const worker = result.data.worker;
const runtime = new Miniflare({
  host: "127.0.0.1",
  port: 0,
  cf: false,
  telemetry: { enabled: false },
  workers: [
    {
      config: {
        name: worker.name,
        compatibilityDate: worker.compatibilityDate,
        // Miniflare requires a module even for assets. The asset router skips it.
        manifest: {
          mainModule: "unused.mjs",
          modules: {
            "unused.mjs": {
              type: "esm",
              contents:
                'export default { fetch() { throw new Error("Unexpected Worker request"); } };',
            },
          },
        },
        assets: {
          ...worker.assets,
          directory: path.join(webRoot, "storybook-static"),
          hasUserWorker: false,
        },
      },
    },
  ],
});

try {
  for (const [route, file] of [
    ["/", "index.html"],
    ["/iframe.html", "iframe.html"],
  ]) {
    const response = await runtime.dispatchFetch(
      `http://storybook.local${route}`,
    );
    assert.equal(response.status, 200, `${route} must serve Storybook HTML`);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html/);
    const html = await response.text();
    assert.equal(
      html,
      readFileSync(path.join(webRoot, "storybook-static", file), "utf8"),
    );
    for (const match of html.matchAll(
      /(?:src|href)=["']\.\/([^"']+\.(?:js|css))["']/g,
    )) {
      const asset = await runtime.dispatchFetch(
        `http://storybook.local/${match[1]}`,
      );
      assert.equal(asset.status, 200, `${match[1]} must load`);
      assert.match(
        asset.headers.get("content-type") ?? "",
        match[1].endsWith(".css") ? /^text\/css/ : /javascript/,
      );
      await asset.body?.cancel();
    }
    console.log(
      `Hosting passed: ${route} serves HTML and its JavaScript and CSS load.`,
    );
  }
  const missing = await runtime.dispatchFetch(
    "http://storybook.local/missing-asset.js",
  );
  assert.equal(
    missing.status,
    404,
    "A missing asset must not return Storybook HTML",
  );
  await missing.body?.cancel();
} finally {
  await runtime.dispose();
}
