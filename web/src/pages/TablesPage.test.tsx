import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import TablesPage from "./TablesPage";
import { tableService } from "@/services/tableService";
vi.mock("@clerk/clerk-react", () => ({ useUser: () => ({ user: { firstName: "Henry" } }) }));
vi.mock("@/services/tableService", () => ({ tableService: { list: vi.fn(), create: vi.fn() } }));
afterEach(cleanup);
it("labels the saved mode and sends the selected Red River mode when creating a table", async () => {
  vi.mocked(tableService.list).mockResolvedValue({ tables: [{ id: "existing", name: "Friday", gameMode: "red-river-holdem", seats: 2, maxPlayers: 6, smallBlind: 5, bigBlind: 10, street: "waiting" }] });
  vi.mocked(tableService.create).mockResolvedValue({ id: "new-table" } as any);
  render(<MemoryRouter><TablesPage /></MemoryRouter>);
  expect(await screen.findByRole("link", { name: /Friday.*Red River Hold'em/ })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Create table" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Game mode" }), { target: { value: "red-river-holdem" } });
  fireEvent.click(screen.getByRole("button", { name: "Open table" }));
  await waitFor(() => expect(tableService.create).toHaveBeenCalledWith(expect.objectContaining({ gameMode: "red-river-holdem", bigBlind: 10 }), "Henry"));
});
it("labels Ghost tables and sends the Ghost modifier with either mode", async () => {
  vi.mocked(tableService.list).mockResolvedValue({ tables: [{ id: "ghostly", name: "Haunt", gameMode: "holdem", ghost: true, seats: 2, maxPlayers: 6, smallBlind: 5, bigBlind: 10, street: "waiting" }] });
  vi.mocked(tableService.create).mockResolvedValue({ id: "new-table" } as never);
  render(<MemoryRouter><TablesPage /></MemoryRouter>);
  expect(await screen.findByRole("link", { name: /Haunt.*No-limit Hold'em · Ghost/ })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Create table" }));
  const ghost = screen.getByRole("checkbox", { name: "Ghost hand" });
  expect(ghost).not.toBeChecked();
  fireEvent.click(ghost);
  fireEvent.change(screen.getByRole("combobox", { name: "Game mode" }), { target: { value: "red-river-holdem" } });
  fireEvent.click(screen.getByRole("button", { name: "Open table" }));
  await waitFor(() => expect(tableService.create).toHaveBeenLastCalledWith(expect.objectContaining({ gameMode: "red-river-holdem", ghost: true }), "Henry"));
});
const openCreateForm = async () => {
  vi.mocked(tableService.list).mockResolvedValue({ tables: [] });
  vi.mocked(tableService.create).mockClear();
  const user = userEvent.setup();
  render(<MemoryRouter><TablesPage /></MemoryRouter>);
  await user.click(await screen.findByRole("button", { name: "Create table" }));
  const help = screen.getByRole("button", { name: "How Ghost hand works" });
  return { user, help, ghost: screen.getByRole("checkbox", { name: "Ghost hand" }) };
};
const presses = [
  ["click", (user: ReturnType<typeof userEvent.setup>, target: HTMLElement) => user.click(target)],
  ["touch", (user: ReturnType<typeof userEvent.setup>, target: HTMLElement) => user.pointer({ keys: "[TouchA]", target })],
] as const;
it.each(presses)("opens Ghost hand help on %s without toggling Ghost or submitting", async (_, press) => {
  const { user, help, ghost } = await openCreateForm();
  expect(help).toHaveAttribute("type", "button");
  expect(help.closest("label")).toBeNull();
  await press(user, help);
  const popup = await screen.findByRole("dialog", { name: "How Ghost hand works" });
  expect(popup).toHaveAccessibleDescription(/hidden ghost/i);
  expect(help).toHaveAttribute("aria-expanded", "true");
  expect(ghost).not.toBeChecked();
  expect(tableService.create).not.toHaveBeenCalled();
});
it.each(presses)("closes Ghost hand help on outside %s and keeps the checkbox independent", async (_, press) => {
  const { user, help, ghost } = await openCreateForm();
  await press(user, help);
  await screen.findByRole("dialog", { name: "How Ghost hand works" });
  await press(user, screen.getByRole("heading", { name: "Create a table" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(ghost).not.toBeChecked();
  await press(user, screen.getByText("Ghost hand"));
  expect(ghost).toBeChecked();
  await press(user, help);
  expect(await screen.findByRole("dialog", { name: "How Ghost hand works" })).toBeVisible();
  expect(ghost).toBeChecked();
  expect(tableService.create).not.toHaveBeenCalled();
});
it("explains the Ghost hand rules for both modes", async () => {
  const { user, help } = await openCreateForm();
  await user.click(help);
  const popup = await screen.findByRole("dialog", { name: "How Ghost hand works" });
  expect(popup).toHaveAccessibleDescription(/two cards from the same deck/i);
  expect(popup).toHaveAccessibleDescription(/Hold'em and Red River/);
  expect(popup).toHaveAccessibleDescription(/same board/i);
  expect(popup).toHaveAccessibleDescription(/beat the ghost to win each main pot and side pot/i);
  expect(popup).toHaveAccessibleDescription(/ghost.s chips go into the next hand.s main pot/i);
  expect(popup).toHaveAccessibleDescription(/tie.*one ghost share.*next hand/i);
  expect(popup).toHaveAccessibleDescription(/fold.*full pot.*no ghost showdown/i);
});
it.each(["{Enter}", " "])("opens Ghost hand help with %s and closes it with Escape", async (key) => {
  const { user, help, ghost } = await openCreateForm();
  help.focus();
  await user.keyboard(key);
  expect(await screen.findByRole("dialog", { name: "How Ghost hand works" })).toBeVisible();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(help).toHaveFocus();
  expect(help).toHaveAttribute("aria-expanded", "false");
  expect(ghost).not.toBeChecked();
  expect(tableService.create).not.toHaveBeenCalled();
});
