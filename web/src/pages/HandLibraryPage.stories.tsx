import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { delay, http, HttpResponse } from "msw";
import HandLibraryPage from "./HandLibraryPage";
import { handList } from "@/storybook/fixtures";
import { useHandLibraryFiltersStore } from "@/stores/useHandLibraryFiltersStore";

const meta = {
  title: "Pages/HandLibrary",
  component: HandLibraryPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    route: "/hands/library",
    routePath: "/hands/library",
  },
} satisfies Meta<typeof HandLibraryPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Loading: Story = {
  parameters: {
    msw: [
      http.get("*/hands", async () => {
        await delay("infinite");
        return HttpResponse.json({});
      }),
    ],
  },
};
export const Empty: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("button", {
        name: "Record your first hand",
      }),
    ).toBeVisible();
  },
  parameters: {
    msw: [
      http.get("*/hands", () =>
        HttpResponse.json({ hands: [], nextCursor: null }),
      ),
    ],
  },
};
export const NoMatches: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText("No hands match your filters."),
    ).toBeVisible();
  },
  beforeEach: () => {
    useHandLibraryFiltersStore.setState({ stakes: "500/1000" });
  },
};
export const List: Story = {
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("table")).toBeVisible();
  },
};
export const Grid: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      (
        await within(canvasElement).findAllByRole("button", {
          name: "Replay hand",
        })
      )[0],
    ).toBeVisible();
  },
  beforeEach: () => {
    useHandLibraryFiltersStore.setState({ viewMode: "grid" });
  },
};
export const Error: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("alert"),
    ).toHaveTextContent("Library unavailable");
  },
  parameters: {
    msw: [
      http.get("*/hands", () =>
        HttpResponse.json({ error: "Library unavailable." }, { status: 503 }),
      ),
    ],
  },
};
export const Pagination: Story = {
  parameters: {
    msw: [
      http.get("*/hands", ({ request }) => {
        const more = new URL(request.url).searchParams.has("cursor");
        return HttpResponse.json({
          hands: more ? handList(12).slice(6) : handList(),
          nextCursor: more ? null : "page-2",
        });
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(await c.findByRole("button", { name: "Load more" }));
    await waitFor(() =>
      expect(c.getAllByRole("button", { name: "Replay hand" })).toHaveLength(
        12,
      ),
    );
  },
};
