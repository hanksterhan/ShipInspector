import { resolve4 } from "node:dns/promises";
import { readFileSync, readdirSync } from "node:fs";
import { get } from "node:https";
import path from "node:path";

const webRoot = path.resolve(import.meta.dirname, "..");
const html = readFileSync(
  path.join(webRoot, "storybook-static/iframe.html"),
  "utf8",
);
const previewScript = html.match(
  /(?:src|href)="\.\/(assets\/[^"?]+\.js)"/,
)?.[1];
const storyScript = readdirSync(
  path.join(webRoot, "storybook-static/assets"),
).find((file) => file.includes(".stories-") && file.endsWith(".js"));
const stylesheet = html.match(/href="\.\/(assets\/[^"?]+\.css)"/)?.[1];
if (!previewScript || !storyScript || !stylesheet)
  throw new Error("Build Storybook before checking Access.");
const hostname = "storybook.sipoker.club";
// Query DNS directly so a new hostname does not use macOS's cached NXDOMAIN.
// HTTPS still checks the certificate for the original hostname.
const addresses = await resolve4(hostname);
if (!addresses.length) throw new Error("Storybook has no public DNS address.");
const paths = [
  "/",
  "/index.html",
  "/iframe.html",
  "/index.json",
  `/${previewScript}`,
  `/assets/${storyScript}`,
  `/${stylesheet}`,
  "/sb-manager/runtime.js",
  "/mockServiceWorker.js",
];
for (const assetPath of paths) {
  const response = await new Promise((resolve, reject) => {
    const request = get(
      `https://${hostname}${assetPath}`,
      {
        signal: AbortSignal.timeout(15000),
        lookup(_host, options, callback) {
          if (options.all)
            callback(
              null,
              addresses.map((address) => ({ address, family: 4 })),
            );
          else callback(null, addresses[0], 4);
        },
      },
      (response) => {
        response.resume();
        resolve(response);
      },
    );
    request.on("error", reject);
  });
  const location = response.headers.location;
  const login = location && new URL(location, `https://${hostname}`);
  if (
    ![302, 303, 307, 308].includes(response.statusCode) ||
    login?.protocol !== "https:" ||
    login.hostname !== "h6nk.cloudflareaccess.com" ||
    !login.pathname.startsWith(`/cdn-cgi/access/login/${hostname}`)
  ) {
    throw new Error(
      `Access failed for ${assetPath}: HTTP ${response.statusCode}. Expected the Cloudflare login redirect.`,
    );
  }
  console.log(`Protected: ${assetPath}`);
}
