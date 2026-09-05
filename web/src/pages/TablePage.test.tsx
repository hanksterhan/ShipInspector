import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import TablePage from "./TablePage";
import { timedTable } from "@/test/timedTable";

vi.mock("@clerk/clerk-react", () => ({
  useUser: () => ({ user: { firstName: "Henry" } }),
}));
vi.mock("@/hooks/useCardDeal", () => ({ useCardDeal: () => null }));
vi.mock("@/hooks/useLiveTable", () => ({ useLiveTable: () => live }));
let live: ReturnType<typeof makeLive>;
const makeLive = () => ({
  table: timedTable(100000),
  receivedAt: { current: Date.now() },
  loading: false,
  needsJoin: false,
  error: "",
  retry: null,
  busy: false,
  connected: true,
  send: vi.fn(),
  refresh: vi.fn(),
  accept: vi.fn(),
  retryAction: vi.fn(),
});
const page = () => (
  <MemoryRouter>
    <TablePage />
  </MemoryRouter>
);
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-05T12:00:00Z"));
  live = makeLive();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it("counts down from server time, warns at ten and five seconds, and disables expired actions", () => {
  const { container } = render(page());
  expect(
    screen.getAllByRole("timer", { name: "Your turn: 30 seconds left" }),
  ).toHaveLength(2);
  advance(1001);
  expect(
    screen.getAllByRole("timer", { name: "Your turn: 29 seconds left" }),
  ).toHaveLength(2);
  advance(19000);
  expect(container.querySelector(".your-action")).toHaveClass(
    "has-turn-warning",
  );
  expect(
    screen.getByText("Ten seconds or less. Time running out."),
  ).toBeInTheDocument();
  advance(5000);
  expect(container.querySelector(".your-action")).toHaveClass(
    "has-turn-critical",
  );
  expect(
    screen.getAllByRole("timer", { name: "Your turn: 5 seconds left" }),
  ).toHaveLength(2);
  advance(1000);
  expect(
    screen.getByText("Five seconds or less. Act now."),
  ).toBeInTheDocument();
  advance(10000);
  expect(
    screen.getAllByRole("timer", { name: "Your turn: 0 seconds left" }),
  ).toHaveLength(2);
  expect(container.querySelector(".your-action")).toHaveClass(
    "has-turn-expired",
  );
  expect(screen.getByRole("button", { name: "Call 10" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Fold" })).toBeDisabled();
  expect(live.send).not.toHaveBeenCalled();
});

it("keeps a polled deadline and transfers both timers when the actor changes", () => {
  const { rerender, container } = render(page());
  advance(20500);
  live.table = { ...live.table, serverTime: 120500 };
  live.receivedAt.current = Date.now();
  rerender(page());
  expect(
    screen.getAllByRole("timer", { name: "Your turn: 10 seconds left" }),
  ).toHaveLength(2);
  live.table = {
    ...live.table,
    version: 2,
    actor: 1,
    legal: null,
    deadline: 150500,
  } as typeof live.table;
  rerender(page());
  expect(
    screen.getAllByRole("timer", { name: "Marina's turn: 30 seconds left" }),
  ).toHaveLength(2);
  expect(container.querySelector('[data-seat="0"] [role="timer"]')).toBeNull();
  expect(container.querySelectorAll(".has-turn-warning")).toHaveLength(0);
  expect(screen.queryByText("Act now")).not.toBeInTheDocument();
});

it("continues while disconnected and catches up when a background tab returns", () => {
  const { rerender } = render(page());
  live.connected = false;
  rerender(page());
  advance(25001);
  expect(
    screen.getAllByRole("timer", { name: "Your turn: 5 seconds left" }),
  ).toHaveLength(2);
  vi.setSystemTime(Date.now() + 20000);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(
    screen.getAllByRole("timer", { name: "Your turn: 0 seconds left" }),
  ).toHaveLength(2);
  live.table = { ...timedTable(200000), version: 3 };
  live.receivedAt.current = Date.now();
  live.connected = true;
  rerender(page());
  expect(
    screen.getAllByRole("timer", { name: "Your turn: 30 seconds left" }),
  ).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Call 10" })).toBeEnabled();
});

it("removes timers and warnings outside an active turn", () => {
  const { rerender, container } = render(page());
  advance(26001);
  for (const update of [
    { street: "complete" as const },
    { street: "waiting" as const },
    { closed: true },
    { actor: null },
    { deadline: null },
  ]) {
    live.table = { ...timedTable(), ...update };
    rerender(page());
    expect(screen.queryAllByRole("timer")).toHaveLength(0);
    expect(container.querySelectorAll(".has-turn-warning")).toHaveLength(0);
  }
});
