import { useEffect, useState } from "react";
import type { TableView } from "@common/interfaces/tableInterfaces";

export function useTurnCountdown(table: TableView | null, receivedAt: number) {
  const [, tick] = useState(0);
  const active =
    table &&
    !table.closed &&
    table.actor !== null &&
    table.deadline !== null &&
    !["waiting", "complete"].includes(table.street);
  // Use the server's clock offset, including time spent disconnected. Read the
  // local time on every render so a fresh snapshot cannot use an old tick.
  const milliseconds = active
    ? Math.max(
        0,
        table.deadline! - table.serverTime - (Date.now() - receivedAt),
      )
    : null;
  const remaining =
    milliseconds === null ? null : Math.ceil(milliseconds / 1000);

  useEffect(() => {
    if (milliseconds === null || remaining === null) return;
    const update = () => tick((value) => value + 1);
    const resume = () => {
      if (!document.hidden) update();
    };
    // Align ticks with the deadline instead of a separate one-second interval.
    const timer =
      remaining > 0
        ? window.setTimeout(update, milliseconds - (remaining - 1) * 1000 + 1)
        : undefined;
    document.addEventListener("visibilitychange", resume);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [milliseconds, remaining]);

  return remaining;
}
