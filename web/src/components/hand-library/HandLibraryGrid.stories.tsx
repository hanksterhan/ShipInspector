import { knownA11y } from "@/storybook/knownA11y";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { http, HttpResponse } from "msw";
import { HandLibraryGrid } from "./HandLibraryGrid";
import HandLibraryPage from "@/pages/HandLibraryPage";
import { handList } from "@/storybook/fixtures";
import { useHandLibraryStore } from "@/stores/useHandLibraryStore";
import { useHandLibraryFiltersStore } from "@/stores/useHandLibraryFiltersStore";

const hands = handList();
const meta = {
  title: "Library/HandLibraryGrid",
  component: HandLibraryGrid,
  tags: ["autodocs"],
  args: { hands },
  beforeEach: () => {
    useHandLibraryStore.setState({ hands });
  },
} satisfies Meta<typeof HandLibraryGrid>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = { args: { hands: [] } };
export const Single: Story = { args: { hands: handList(1) } };
export const Many: Story = { args: { hands: handList(24) } };
export const LongContent: Story = {
  args: {
    hands: hands.map((hand) => ({
      ...hand,
      small_blind: 500000,
      big_blind: 1000000,
      board_turn: "9s",
      board_river: "3c",
    })),
  },
};
export const DeleteOpen: Story = {
  parameters: knownA11y("library-handlibrarygrid--delete-open"),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getAllByRole("button", { name: "Delete hand" })[0],
    );
  },
};
// The grid delegates failed-delete feedback to its real page parent.
export const DeleteError: Story = {
  render: () => <HandLibraryPage />,
  beforeEach: () => {
    useHandLibraryFiltersStore.setState({ viewMode: "grid" });
  },
  parameters: {
    msw: [
      http.get("*/hands", () => HttpResponse.json({ hands, nextCursor: null })),
      http.delete("*/hands/:id", () =>
        HttpResponse.json({ error: "Could not delete hand." }, { status: 503 }),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const buttons = await c.findAllByRole("button", { name: "Delete hand" });
    await userEvent.click(buttons[0]);
    const dialog = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.click(
      within(dialog).getByRole("button", { name: /^Delete$/ }),
    );
    await waitFor(() => expect(dialog).not.toBeInTheDocument(), {
      timeout: 4000,
    });
    await expect(
      await c.findByRole("alert", {}, { timeout: 3000 }),
    ).toHaveTextContent("Could not delete hand");
  },
};
