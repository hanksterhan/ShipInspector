import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TableView } from "@common/interfaces/tableInterfaces";
import { useLiveTable } from "./useLiveTable";
import { tableService } from "@/services/tableService";

vi.mock("@/services/tableService", () => ({
  tableService: { get: vi.fn(), command: vi.fn() },
}));
const snapshot = (version = 0, id = "table-a"): TableView => ({
  id,
  version,
  settings: {
    name: "Table",
    maxPlayers: 2,
    smallBlind: 5,
    bigBlind: 10,
    startingStack: 1000,
    turnSeconds: 60,
  },
  isOwner: true,
  yourSeat: 0,
  street: "waiting",
  handNumber: 0,
  button: 0,
  actor: null,
  deadline: null,
  serverTime: Date.now(),
  board: [],
  pot: 0,
  currentBet: 0,
  seats: [],
  legal: null,
  awards: [],
  events: [],
  canDeal: false,
  closed: false,
  agents: [],
});
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(tableService.get).mockResolvedValue(snapshot());
});
describe("live table network recovery", () => {
  it.each([undefined, 503])(
    "retries an uncertain action with status %s using the same request ID and version",
    async (status) => {
      vi.mocked(tableService.command)
        .mockRejectedValueOnce(
          Object.assign(new Error("Connection lost"), { status }),
        )
        .mockResolvedValueOnce(snapshot(1));
      const { result } = renderHook(() => useLiveTable("table-a"));
      await waitFor(() => expect(result.current.loading).toBe(false));
      await act(async () => {
        await result.current.send({ type: "act", action: "call" });
      });
      expect(result.current.retry).not.toBeNull();
      await act(async () => {
        await result.current.retryAction();
      });
      expect(tableService.command).toHaveBeenCalledTimes(2);
      expect(vi.mocked(tableService.command).mock.calls[0][1]).toEqual(
        vi.mocked(tableService.command).mock.calls[1][1],
      );
      expect(result.current.retry).toBeNull();
      expect(result.current.table?.version).toBe(1);
    },
  );
  it("refreshes simultaneous readiness changes and retries once within the same hand", async () => {
    vi.mocked(tableService.get)
      .mockResolvedValueOnce(snapshot())
      .mockResolvedValue(snapshot(1));
    vi.mocked(tableService.command)
      .mockRejectedValueOnce(
        Object.assign(new Error("Changed"), { status: 409 }),
      )
      .mockResolvedValueOnce(snapshot(2));
    const { result } = renderHook(() => useLiveTable("table-a"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.send({ type: "ready", ready: true });
    });
    expect(
      vi.mocked(tableService.command).mock.calls.map((c) => c[1].version),
    ).toEqual([0, 1]);
    expect(result.current.table?.version).toBe(2);
    expect(result.current.error).toBe("");
  });
  it("never resubmits a stale bet automatically", async () => {
    vi.mocked(tableService.get)
      .mockResolvedValueOnce(snapshot())
      .mockResolvedValue(snapshot(1));
    vi.mocked(tableService.command).mockRejectedValue(
      Object.assign(new Error("The table changed"), { status: 409 }),
    );
    const { result } = renderHook(() => useLiveTable("table-a"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.send({ type: "act", action: "raise", raiseTo: 100 });
    });
    expect(tableService.command).toHaveBeenCalledTimes(1);
    expect(result.current.retry).toBeNull();
    expect(result.current.table?.version).toBe(1);
    expect(result.current.error).toBe("The table changed");
  });
  it("does not carry a readiness retry into a new hand", async () => {
    vi.mocked(tableService.get)
      .mockResolvedValueOnce(snapshot())
      .mockResolvedValue({ ...snapshot(1), handNumber: 1 });
    vi.mocked(tableService.command).mockRejectedValue(
      Object.assign(new Error("Changed"), { status: 409 }),
    );
    const { result } = renderHook(() => useLiveTable("table-a"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.send({ type: "ready", ready: true });
    });
    expect(tableService.command).toHaveBeenCalledTimes(1);
  });
  it("ignores an older poll after a new command result arrives", async () => {
    let resolve!: (view: TableView) => void;
    vi.mocked(tableService.get).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { result } = renderHook(() => useLiveTable("table-a"));
    act(() => result.current.accept(snapshot(3)));
    await act(async () => {
      resolve(snapshot(1));
    });
    expect(result.current.table?.version).toBe(3);
  });
  it("ignores a pending response from a table the player has left", async () => {
    let resolve!: (view: TableView) => void;
    vi.mocked(tableService.get)
      .mockReturnValueOnce(
        new Promise((r) => {
          resolve = r;
        }),
      )
      .mockResolvedValue(snapshot(0, "table-b"));
    const { result, rerender } = renderHook(({ id }) => useLiveTable(id), {
      initialProps: { id: "table-a" },
    });
    rerender({ id: "table-b" });
    await waitFor(() => expect(result.current.table?.id).toBe("table-b"));
    await act(async () => {
      resolve(snapshot(99));
    });
    expect(result.current.table?.id).toBe("table-b");
  });
});
