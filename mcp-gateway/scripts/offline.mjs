// Runs Wrangler with no Cloudflare account: a local dev server or an offline
// bundle. It hides any Cloudflare credentials and the user's Wrangler login,
// turns off metrics and the request-metadata download, and refuses any other
// command. Deploying is a separate, manual step.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = dirname(dirname(fileURLToPath(import.meta.url)));
const wrangler = join(root, "node_modules", "wrangler", "bin", "wrangler.js");

export function offlineEnv() {
  const home = join(root, ".wrangler", "offline-config");
  mkdirSync(home, { recursive: true });
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/^(CLOUDFLARE_|CF_)/.test(key)) delete env[key];
  return { ...env, XDG_CONFIG_HOME: home, WRANGLER_LOG_PATH: join(home, "logs"), WRANGLER_SEND_METRICS: "false",
    CLOUDFLARE_CF_FETCH_ENABLED: "false", CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false", NO_COLOR: "1" };
}

// Local settings: loopback host and upstream only, one shared limit bucket.
// Keeping the real local origin lets the Worker check the Host it receives,
// instead of the production host Wrangler would infer from `routes`.
export function devArgs({ port = 8787, upstream = "http://127.0.0.1:3000", config = "wrangler.toml" } = {}) {
  const hosts = `127.0.0.1:${port},localhost:${port}`;
  return ["dev", "--config", config, "--ip", "127.0.0.1", "--port", String(port), "--local", "--show-interactive-dev-session=false", "--infer-origin-from-routes=false",
    "--var", `UPSTREAM_ORIGIN:${upstream}`, "--var", `ALLOWED_HOSTS:${hosts}`, "--var", `PUBLIC_MCP_URL:http://127.0.0.1:${port}/mcp`,
    "--var", "CLIENT_IP_HEADER:none", "--var", "ALLOW_LOOPBACK_HTTP:true"];
}

export function runWrangler(args, options = {}) {
  return spawn(process.execPath, [wrangler, ...args], { cwd: root, env: offlineEnv(), ...options });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, ...rest] = process.argv.slice(2);
  let args;
  if (command === "dev") {
    const upstream = rest[0] || process.env.SHIPINSPECTOR_UPSTREAM || "http://127.0.0.1:3000";
    args = devArgs({ upstream });
  } else if (command === "build") {
    args = ["deploy", "--dry-run", "--outdir", "dist"];
  } else {
    console.error("Use: offline.mjs dev [upstream] | offline.mjs build");
    process.exit(2);
  }
  const child = runWrangler(args, { stdio: "inherit" });
  child.on("exit", code => process.exit(code ?? 1));
}
