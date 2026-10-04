import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadAndParseConfig } from "@cloudflare/config";
import {
  cleanBuildOutputDir,
  readBuildOutput,
  writeAssets,
  writeRootConfig,
  writeWorkerConfig,
} from "@cloudflare/build-output-utils";

const webRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(webRoot, "..");
const deployRoot = path.join(webRoot, ".storybook");
const cf = path.join(webRoot, "node_modules/.bin/cf");
const hostname = "storybook.sipoker.club";
const accountId = "615cf347b166486e8ce9e47a405cf884";
const dryRun = process.argv.length === 3 && process.argv[2] === "--dry-run";
if (process.argv.length > 2 && !dryRun) {
  throw new Error("Usage: npm run deploy:storybook -- [--dry-run]");
}

const buildContext = { isPreview: false };
const { result } = await loadAndParseConfig(
  path.join(deployRoot, "cloudflare.config.ts"),
  buildContext,
);
if (!result.success)
  throw new Error(`Invalid Cloudflare config: ${result.error}`);
const config = result.data;
const worker = config.worker;
const allowedFields = [
  "name",
  "compatibilityDate",
  "domains",
  "workersDev",
  "previewUrls",
  "assets",
];
if (
  config.accountId !== accountId ||
  config.containers.length ||
  !worker ||
  worker.name !== "shipinspector-storybook" ||
  worker.workersDev !== false ||
  worker.previewUrls !== false ||
  worker.domains?.length !== 1 ||
  worker.domains[0] !== hostname ||
  Object.keys(worker).some((key) => !allowedFields.includes(key)) ||
  worker.assets?.htmlHandling !== "auto-trailing-slash" ||
  worker.assets?.notFoundHandling !== "none" ||
  Object.keys(worker.assets).length !== 2
) {
  throw new Error(
    "Storybook must use its separate static Worker and private hostname, with default and version hosts disabled.",
  );
}

const accessToken =
  process.env.CLOUDFLARE_ACCESS_API_TOKEN ||
  (process.env.CLOUDFLARE_ACCESS_TOKEN_FILE &&
    readFileSync(process.env.CLOUDFLARE_ACCESS_TOKEN_FILE, "utf8").trim());
const workerEnv = { ...process.env, CLOUDFLARE_ACCOUNT_ID: accountId };
const accessEnv = {
  ...workerEnv,
  ...(accessToken ? { CLOUDFLARE_API_TOKEN: accessToken } : {}),
};
if (!dryRun) {
  if (!process.stdout.isTTY)
    throw new Error(
      "Publish from an interactive terminal to review any hostname conflict.",
    );
  verifyAccess();
}
const commit = run("git", ["rev-parse", "HEAD"], repoRoot).trim();
const sourceHash = sourceFingerprint();
run("npm", ["run", "build-storybook"], webRoot, process.env, true);
if (sourceFingerprint() !== sourceHash)
  throw new Error("Source changed during the build. No upload started.");

run(
  process.execPath,
  [path.join(webRoot, "scripts/check-storybook-hosting.mjs")],
  webRoot,
  process.env,
  true,
);

// Storybook has its own Vite build. Convert that output for cf without building the app.
await cleanBuildOutputDir(deployRoot);
await writeAssets({
  root: deployRoot,
  sourceDirectory: path.join(webRoot, "storybook-static"),
});
await writeWorkerConfig({ root: deployRoot, config: worker });
await writeRootConfig(deployRoot, { accountId }, buildContext);
await readBuildOutput(deployRoot);
if (!dryRun) verifyAccess();
run(
  cf,
  [
    "deploy",
    "--prebuilt",
    "--message",
    `Storybook ${commit}; source ${sourceHash}`,
    ...(dryRun ? ["--dry-run"] : []),
  ],
  deployRoot,
  workerEnv,
  true,
);
if (!dryRun) {
  verifyAccess();
  const workers = [];
  for (let page = 1; ; page++) {
    const entries = JSON.parse(
      run(
        cf,
        ["workers", "list", "--page", String(page), "--per-page", "50"],
        deployRoot,
        workerEnv,
      ),
    );
    if (!Array.isArray(entries))
      throw new Error("Cloudflare returned an invalid Worker list.");
    workers.push(...entries);
    if (entries.length < 50) break;
  }
  const deployed = workers.find((entry) => entry.name === worker.name);
  if (
    !deployed ||
    deployed.subdomain?.enabled !== false ||
    deployed.subdomain?.previews_enabled !== false ||
    deployed.references?.domains?.length !== 1 ||
    deployed.references.domains[0].hostname !== hostname
  ) {
    throw new Error(
      "Cloudflare did not confirm the private hostname and disabled default and version hosts.",
    );
  }
  console.log("Hosted Worker hostname and disabled preview URLs verified.");
  run(
    process.execPath,
    [path.join(webRoot, "scripts/verify-storybook-access.mjs")],
    webRoot,
    process.env,
    true,
  );
}
console.log(
  `${dryRun ? "Dry run passed" : "Published"}: ${commit}${dryRun ? "" : ` at https://${hostname}`}`,
);

function verifyAccess() {
  const apps = [];
  for (let page = 1; ; page++) {
    const entries = JSON.parse(
      run(
        cf,
        [
          "zero-trust",
          "access",
          "applications",
          "list",
          "--page",
          String(page),
          "--per-page",
          "50",
        ],
        deployRoot,
        accessEnv,
      ),
    );
    if (!Array.isArray(entries))
      throw new Error("Access returned an invalid application list.");
    apps.push(...entries);
    if (entries.length < 50) break;
  }
  const matches = apps.filter((app) =>
    [app.domain, ...(app.destinations ?? []).map((dest) => dest.uri)].some(
      (domain) => domain?.split("/")[0] === hostname,
    ),
  );
  const app = matches[0];
  const policy = app?.policies?.[0];
  const rule = policy?.include?.[0];
  if (
    matches.length !== 1 ||
    app.type !== "self_hosted" ||
    app.domain !== hostname ||
    app.destinations?.length !== 1 ||
    app.destinations[0].type !== "public" ||
    app.destinations[0].uri !== hostname ||
    app.allowed_idps?.length !== 1 ||
    app.allowed_idps[0] !== "2d4ca5e1-89a4-4eb8-bdd7-72f7868bd247" ||
    app.options_preflight_bypass !== false ||
    app.policies?.length !== 1 ||
    policy.decision !== "allow" ||
    policy.include?.length !== 1 ||
    Object.keys(rule ?? {}).length !== 1 ||
    rule?.email?.email !== "henryhan62@gmail.com" ||
    policy.exclude?.length ||
    policy.require?.length
  ) {
    throw new Error(
      "Storybook needs one whole-host Access application and one Allow rule for Henry's email. No upload started.",
    );
  }
  console.log("Owner-only Cloudflare Access rule verified.");
}

function sourceFingerprint() {
  const hash = createHash("sha256");
  hash.update(run("git", ["rev-parse", "HEAD"], repoRoot));
  const files = run(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    repoRoot,
  )
    .split("\0")
    .filter(Boolean)
    .sort();
  for (const file of files) {
    hash.update(`${file}\0`);
    try {
      hash.update(readFileSync(path.join(repoRoot, file)));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      hash.update("deleted");
    }
  }
  return hash.digest("hex");
}

function run(command, args, cwd, env = process.env, inherit = false) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: "utf8",
    stdio: inherit ? "inherit" : "pipe",
  });
  if (result.status !== 0) {
    if (!inherit && result.stderr) process.stderr.write(result.stderr);
    throw new Error(`${path.basename(command)} failed.`);
  }
  return result.stdout;
}
