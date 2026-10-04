// Hold only named transient page timers. Drafts, requests, and animations keep
// their normal timing. The story cleanup restores the real timer function.
export function holdTimeouts(delays: number[]) {
  const original = window.setTimeout.bind(window);
  const held: number[] = [];
  window.setTimeout = ((
    handler: TimerHandler,
    delay?: number,
    ...args: unknown[]
  ) => {
    const hold = delays.includes(delay ?? 0);
    const id = original(handler, hold ? 2_000_000_000 : delay, ...args);
    if (hold) held.push(id);
    return id;
  }) as typeof window.setTimeout;
  return () => {
    held.forEach((id) => window.clearTimeout(id));
    window.setTimeout = original;
  };
}
