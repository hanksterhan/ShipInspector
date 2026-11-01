// Gateway settings come only from the Worker's trusted environment. Errors
// name the setting but never echo its value.
const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);
const HOST = /^(?:(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?|\[::1\])(?::\d{1,5})?$/;
export const LIMITERS = { admission: "ADMISSION_LIMITER", credential: "CREDENTIAL_LIMITER", upstream: "UPSTREAM_LIMITER", gateway: "GATEWAY_UPSTREAM_LIMITER" };

export class ConfigError extends Error {
  constructor(setting) { super(`Invalid gateway setting: ${setting}`); this.name = "ConfigError"; this.setting = setting; }
}

function list(env, setting) {
  const value = env[setting] ?? "";
  if (typeof value !== "string") throw new ConfigError(setting);
  return value.split(",").map(item => item.trim()).filter(Boolean);
}

// Accept only a bare origin: no user info, path, query, or fragment. Cleartext
// HTTP needs ALLOW_LOOPBACK_HTTP and a loopback host.
function origin(value, setting, allowLoopbackHttp, path = "/") {
  if (typeof value !== "string") throw new ConfigError(setting);
  let url;
  try { url = new URL(value); } catch { throw new ConfigError(setting); }
  const expected = path === "/" ? [url.origin, `${url.origin}/`] : [`${url.origin}${path}`];
  if (!expected.includes(value) || url.pathname !== path) throw new ConfigError(setting);
  const https = url.protocol === "https:";
  const loopbackHttp = url.protocol === "http:" && allowLoopbackHttp && LOOPBACK.has(url.hostname);
  if (!https && !loopbackHttp) throw new ConfigError(setting);
  return path === "/" ? url.origin : url.href;
}

const cache = new WeakMap();
export function readConfig(env) {
  if (!env || typeof env !== "object") throw new ConfigError("env");
  if (cache.has(env)) return cache.get(env);
  const loopbackFlag = env.ALLOW_LOOPBACK_HTTP ?? "false";
  if (!["true", "false"].includes(loopbackFlag)) throw new ConfigError("ALLOW_LOOPBACK_HTTP");
  const allowLoopbackHttp = loopbackFlag === "true";
  const hosts = list(env, "ALLOWED_HOSTS").map(h => h.toLowerCase());
  if (hosts.length === 0 || !hosts.every(h => HOST.test(h))) throw new ConfigError("ALLOWED_HOSTS");
  const origins = list(env, "ALLOWED_ORIGINS").map(o => origin(o, "ALLOWED_ORIGINS", allowLoopbackHttp));
  const ipHeader = env.CLIENT_IP_HEADER;
  if (!["cf-connecting-ip", "none"].includes(ipHeader)) throw new ConfigError("CLIENT_IP_HEADER");
  const limiters = {};
  for (const [key, binding] of Object.entries(LIMITERS)) {
    if (typeof env[binding]?.limit !== "function") throw new ConfigError(binding);
    limiters[key] = env[binding];
  }
  const config = Object.freeze({
    upstream: origin(env.UPSTREAM_ORIGIN, "UPSTREAM_ORIGIN", allowLoopbackHttp),
    publicUrl: origin(env.PUBLIC_MCP_URL, "PUBLIC_MCP_URL", allowLoopbackHttp, "/mcp"),
    hosts: new Set(hosts), origins: new Set(origins), ipHeader, limiters,
  });
  cache.set(env, config);
  return config;
}
