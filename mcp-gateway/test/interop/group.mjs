// Start a command as the leader of a new process group (POSIX), so cleanup
// reaches every process it starts, such as the Python that `uv run` starts,
// and not only the first PID. stop() signals the group, never another PID.
import { spawn } from "node:child_process";

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export function spawnGroup(command, args, options = {}) {
  const child = spawn(command, args, { ...options, detached: true });
  // A failed spawn (for example, no such command) has no PID and no group.
  const started = new Promise((resolve, reject) => {
    child.once("spawn", resolve);
    child.once("error", error => reject(new Error(`could not start ${command}: ${error.code ?? "spawn error"}`)));
  });
  started.catch(() => {});
  // "close" comes after the process exits and every inherited stdio pipe has
  // closed, which needs every process that holds a pipe end to exit too.
  let closed = false;
  const done = new Promise(resolve => {
    child.once("close", (code, signal) => { closed = true; resolve({ code, signal }); });
    child.once("error", () => { if (!child.pid) { closed = true; resolve({ code: null, signal: null }); } });
  });
  // The group ID stays reserved while any member lives, so a signal to it
  // cannot reach an unrelated process until the whole group is gone.
  let gone = !child.pid;
  const alive = () => {
    if (gone) return false;
    try { process.kill(-child.pid, 0); return true; } catch { gone = true; return false; }
  };
  const signal = name => { if (alive()) try { process.kill(-child.pid, name); } catch { gone = true; } };
  async function until(check, ms) {
    const end = Date.now() + ms;
    while (!check() && Date.now() < end) await delay(50);
    return check();
  }
  return {
    child, started, done, alive, isClosed: () => closed,
    // SIGTERM to the group, SIGKILL after `graceMs`, then wait up to `killMs`
    // for the group to empty and the pipes to close. Throws if either is left.
    async stop({ graceMs = 3000, killMs = 5000 } = {}) {
      if (!child.pid) return;
      signal("SIGTERM");
      if (!(await until(() => !alive(), graceMs))) signal("SIGKILL");
      const groupGone = await until(() => !alive(), killMs);
      const pipesClosed = await until(() => closed, killMs);
      if (!groupGone || !pipesClosed) throw new Error(`process group cleanup incomplete: group ${groupGone ? "gone" : "running"}, pipes ${pipesClosed ? "closed" : "open"}`);
    },
  };
}
