// Cleanup check for the Python interop run: a real `uv run` Python child that
// ignores SIGTERM. Uses uv's cached Python 3.12 and no network; skips with the
// reason when uv or that Python is missing. Not workerd evidence.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { spawnGroup } from "./interop/group.mjs";

const SCRIPT = "import os, signal, time\nsignal.signal(signal.SIGTERM, signal.SIG_IGN)\nprint(os.getpid(), flush=True)\ntime.sleep(600)\n";
const exists = pid => { try { process.kill(pid, 0); return true; } catch (error) { return error.code === "EPERM"; } };
const groupOf = pid => Number(execFileSync("ps", ["-o", "pgid=", "-p", String(pid)], { encoding: "utf8" }).trim());

test("stop() ends uv and its Python child that ignores SIGTERM, and the pipes close", { timeout: 60000 }, async t => {
  const group = spawnGroup("uv", ["run", "--no-project", "--offline", "--python", "3.12", "python", "-c", SCRIPT], { stdio: ["ignore", "pipe", "pipe"] });
  try { await group.started; } catch (error) { t.skip(error.message); return; }
  let out = ""; let err = "";
  group.child.stdout.on("data", chunk => { out += chunk; }); group.child.stderr.on("data", chunk => { err += chunk; });
  let python;
  try {
    const end = Date.now() + 30000;
    while (!/^\d+\n/.test(out) && !group.isClosed() && Date.now() < end) await new Promise(resolve => setTimeout(resolve, 50));
    if (group.isClosed()) { t.skip(`uv could not start Python 3.12 offline: ${err.trim().split("\n").at(-1)}`); return; }
    python = Number(out.split("\n")[0]);
    assert.ok(python > 0, "Python did not report its PID");
    // uv runs Python as a separate process in the same group.
    assert.notEqual(python, group.child.pid);
    assert.equal(groupOf(python), group.child.pid);
    // Python really ignores SIGTERM: a signal to it alone leaves it running.
    process.kill(python, "SIGTERM");
    await new Promise(resolve => setTimeout(resolve, 300));
    assert.equal(exists(python), true);

    const started = Date.now();
    await group.stop({ graceMs: 1000, killMs: 5000 });
    const ms = Date.now() - started;
    assert.equal(exists(python), false, "Python is still running");
    assert.equal(group.alive(), false);
    assert.equal(group.isClosed(), true);
    assert.ok(ms < 7000, `cleanup took ${ms} ms`);
    const { signal } = await group.done;
    assert.ok(signal === "SIGKILL" || signal === "SIGTERM", `uv ended with ${signal}`);
  } finally {
    // If an assertion failed first, end the group so no test process is left.
    if (group.alive()) process.kill(-group.child.pid, "SIGKILL");
  }
});

test("a command that cannot start fails at once and stop() has nothing to do", async () => {
  const group = spawnGroup("shipinspector-no-such-command", [], { stdio: ["ignore", "pipe", "pipe"] });
  await assert.rejects(group.started, /could not start shipinspector-no-such-command: ENOENT/);
  await group.stop();
  assert.equal(group.alive(), false);
});
