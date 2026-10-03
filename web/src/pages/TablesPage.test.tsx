import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
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
