const pending = new Set<{ controller: AbortController; promise: Promise<Response> }>();
let installed = false;
let resetting = false;

export function installRequestBoundary() {
  if (installed) return;
  installed = true;
  const fetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input), location.href);
    if (url.origin !== location.origin) return Promise.reject(new Error(`Storybook blocked external request: ${url.origin}`));
    if (!/^\/(?:api\/tables|hands|poker|auth\/me)(?:\/|$)/.test(url.pathname)) return fetch(input, init);
    if (resetting) return Promise.reject(new DOMException("Story reset", "AbortError"));
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, ...(init?.signal ? [init.signal] : input instanceof Request ? [input.signal] : [])]);
    const promise = fetch(input, { ...init, signal });
    const entry = { controller, promise };
    pending.add(entry);
    void promise.then(() => pending.delete(entry), () => pending.delete(entry));
    return promise;
  };
}

export async function stopRequests() {
  resetting = true;
  const entries = [...pending];
  entries.forEach(entry => entry.controller.abort());
  await Promise.allSettled(entries.map(entry => entry.promise));
}
export function allowRequests() { resetting = false; }
