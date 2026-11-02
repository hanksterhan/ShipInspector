// Test bench isolation. `wrangler dev` reloads when its config file changes
// and answers an open POST with its own 503 ("Your worker restarted
// mid-request"). So two test runs in one checkout must never write the same
// config file or evidence log.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync, statSync } from "node:fs";
import { evidenceDir, variantConfig } from "./harness.mjs";

test("each variantConfig() call writes its own file and leaves earlier files alone", async () => {
  const first = variantConfig("isolation", text => `${text}\n# first\n`);
  const before = { text: readFileSync(first, "utf8"), mtime: statSync(first).mtimeMs };
  await new Promise(resolve => setTimeout(resolve, 20));
  const second = variantConfig("isolation", text => `${text}\n# second\n`);
  assert.notEqual(second, first);
  assert.equal(readFileSync(first, "utf8"), before.text);
  assert.equal(statSync(first).mtimeMs, before.mtime);
  assert.match(readFileSync(second, "utf8"), /# second/);
  assert.ok(existsSync(first) && existsSync(second));
  for (const file of [first, second]) rmSync(file);
});

test("evidence logs go to a directory for this run unless one is set", () => {
  if (process.env.GATEWAY_EVIDENCE_DIR) return assert.equal(evidenceDir, process.env.GATEWAY_EVIDENCE_DIR);
  assert.match(evidenceDir, new RegExp(`test-logs/run-\\d+-${process.pid}-[0-9a-f]{8}$`));
});
