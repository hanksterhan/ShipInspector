import { useCallback, useEffect, useRef, useState } from "react";
import type {
  TableCommand,
  TableCommandRequest,
  TableView,
} from "@common/interfaces/tableInterfaces";
import { tableService } from "@/services/tableService";

export function useLiveTable(id: string) {
  const [table, setTable] = useState<TableView | null>(null);
  const current = useRef<TableView | null>(null);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [needsJoin, setNeedsJoin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState<TableCommandRequest | null>(null);
  const receivedAt = useRef(Date.now());
  const mounted = useRef(true);
  const liveId = useRef(id);
  liveId.current = id;
  const inFlight = useRef(false);
  const accept = useCallback(
    (next: TableView) => {
      if (!mounted.current || next.id !== id || liveId.current !== id) return;
      if (!current.current || next.version >= current.current.version) {
        current.current = next;
        receivedAt.current = Date.now();
        setTable(next);
      }
      setConnected(true);
      setNeedsJoin(false);
      setLoading(false);
      setLoadError("");
    },
    [id],
  );
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      const controller = new AbortController();
      const abort = () => controller.abort();
      if (signal?.aborted) abort();
      else signal?.addEventListener("abort", abort, { once: true });
      const timeout = setTimeout(abort, 8000);
      try {
        const next = await tableService.get(id, controller.signal);
        if (!signal?.aborted) accept(next);
      } catch (err) {
        if (signal?.aborted || !mounted.current || liveId.current !== id)
          return;
        const status = (err as { status?: number }).status;
        setConnected(false);
        setLoading(false);
        setNeedsJoin(status === 403);
        if (status !== 403)
          setLoadError(
            controller.signal.aborted
              ? "Connection timed out. Reconnecting."
              : err instanceof Error
                ? err.message
                : "Could not load this table.",
          );
      } finally {
        clearTimeout(timeout);
        signal?.removeEventListener("abort", abort);
      }
    },
    [id, accept],
  );
  useEffect(() => {
    mounted.current = true;
    current.current = null;
    setTable(null);
    setLoading(true);
    setError("");
    setRetry(null);
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let polling = false;
    const poll = async () => {
      if (polling || controller.signal.aborted) return;
      polling = true;
      await refresh(controller.signal);
      polling = false;
      if (!controller.signal.aborted)
        timer = setTimeout(poll, document.hidden ? 5000 : 1000);
    };
    void poll();
    const resume = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        void poll();
      }
    };
    document.addEventListener("visibilitychange", resume);
    return () => {
      mounted.current = false;
      controller.abort();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [refresh]);
  const perform = useCallback(
    async (input: TableCommandRequest) => {
      if (inFlight.current) return;
      inFlight.current = true;
      const previousHand = current.current?.handNumber;
      const previousStreet = current.current?.street;
      setBusy(true);
      setError("");
      try {
        accept(await tableService.command(id, input));
        setRetry(null);
      } catch (err) {
        if (!mounted.current || liveId.current !== id) return;
        let failure = err;
        // Readiness is an absolute choice. If another seat changed readiness,
        // refresh and retry once, but never carry the choice into a new hand.
        if (
          (err as { status?: number }).status === 409 &&
          input.command.type === "ready"
        ) {
          await refresh();
          if (
            current.current &&
            current.current.handNumber === previousHand &&
            current.current.street === previousStreet &&
            current.current.version !== input.version
          ) {
            try {
              accept(
                await tableService.command(id, {
                  ...input,
                  version: current.current.version,
                }),
              );
              setRetry(null);
              return;
            } catch (retryError) {
              failure = retryError;
            }
          }
        }
        setError(
          failure instanceof Error ? failure.message : "The action failed.",
        );
        const failureStatus = (failure as { status?: number }).status;
        if (!failureStatus || failureStatus >= 500) setRetry(input);
        else setRetry(null);
        await refresh();
      } finally {
        inFlight.current = false;
        if (mounted.current && liveId.current === id) setBusy(false);
      }
    },
    [id, accept, refresh],
  );
  const send = useCallback(
    (command: TableCommand) =>
      perform({
        version: current.current?.version ?? 0,
        requestId: crypto.randomUUID(),
        command,
      }),
    [perform],
  );
  return {
    table,
    error: error || loadError,
    loading,
    connected,
    needsJoin,
    busy,
    retry,
    send,
    retryAction: () => retry && perform(retry),
    refresh,
    accept,
    receivedAt,
  };
}
