import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { delay, http, HttpResponse } from "msw";
import EquityCalculatorPage from "./EquityCalculatorPage";
import { seedStudy } from "@/storybook/seedStudy";
import { card } from "@/storybook/fixtures";
import { useEquityCalculatorStore } from "@/stores/useEquityCalculatorStore";

const meta = {
  title: "Pages/EquityCalculator",
  component: EquityCalculatorPage,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof EquityCalculatorPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Initial: Story = {};
export const PartialFlop: Story = {
  beforeEach: () => {
    seedStudy({ filled: true, boardCount: 2 });
  },
};
export const Loading: Story = {
  beforeEach: () => {
    seedStudy({ filled: true, boardCount: 3 });
  },
  parameters: {
    msw: [
      http.post("*/poker/equity/calculate", async () => {
        await delay("infinite");
        return HttpResponse.json({});
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText("Calculating equity..."),
    ).toBeVisible();
  },
};
export const Error: Story = {
  beforeEach: () => {
    seedStudy({ filled: true, boardCount: 3 });
  },
  parameters: {
    msw: [
      http.post("*/poker/equity/calculate", () =>
        HttpResponse.json(
          { error: "Calculation unavailable." },
          { status: 503 },
        ),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("button", {
        name: "Retry calculation",
      }),
    ).toBeVisible();
  },
};
export const Results: Story = {
  beforeEach: () => {
    seedStudy({ filled: true, boardCount: 3 });
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText("Win 72.0%"),
    ).toBeVisible();
  },
};
export const Showdown: Story = {
  beforeEach: () => {
    seedStudy({ filled: true, boardCount: 5 });
  },
  parameters: {
    msw: [
      http.post("*/poker/equity/calculate", () =>
        HttpResponse.json({
          equity: { win: [1, 0], tie: [0, 0], lose: [0, 1], samples: 1 },
          players: [],
          board: [],
          dead: [],
        }),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(within(canvasElement).getByText("Player 1 wins")).toBeVisible(),
    );
    await expect(
      await within(canvasElement).findByText(
        "Two pair (3s and 2s)",
        {},
        { timeout: 3000 },
      ),
    ).toBeVisible();
  },
};
export const Outs: Story = {
  beforeEach: () => {
    seedStudy({ filled: true, boardCount: 4 });
  },
  parameters: {
    msw: [
      http.post("*/poker/outs/calculate", () =>
        HttpResponse.json({
          suppressed: null,
          win_outs: [card(14, "h"), card(14, "d")],
          tie_outs: [card(12, "c")],
          baseline_win: 0.72,
          baseline_tie: 0.03,
          baseline_lose: 0.25,
          total_river_cards: 44,
        }),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText("Player 1 · River outs"),
    ).toBeVisible();
  },
};
export const ImportError: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.upload(
      c.getByLabelText("Import study file"),
      new File(["{}"], "invalid-study.json", { type: "application/json" }),
    );
    await expect(await c.findByRole("alert")).toBeVisible();
  },
};
export const HelpOpen: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "How to use" }));
    await expect(c.getByRole("button", { name: "How to use" })).toBeVisible();
  },
};
export const PickerOpen: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Choose cards" }),
    );
    const dialog = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(dialog).toBeVisible());
  },
};
export const FullTable: Story = {
  beforeEach: () => {
    seedStudy({ seats: [0, 1, 2, 3, 4, 5, 6, 7] });
  },
};
export const SplitShowdown: Story = {
  ...Showdown,
  parameters: {
    msw: [
      http.post("*/poker/equity/calculate", () =>
        HttpResponse.json({
          equity: { win: [0, 0], tie: [0.5, 0.5], lose: [0, 0], samples: 1 },
          players: [],
          board: [],
          dead: [],
        }),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        within(canvasElement).getByRole("heading", {
          name: "Split pot",
          level: 3,
        }),
      ).toBeVisible(),
    );
  },
};
export const Imported: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const scenario = {
      version: 1,
      variant: "texas-holdem",
      players: [
        { seat: 0, cards: [card(14, "s"), card(13, "s")] },
        { seat: 1, cards: [card(12, "h"), card(12, "d")] },
      ],
      board: [null, null, null, null, null],
    };
    await userEvent.upload(
      c.getByLabelText("Import study file"),
      new File([JSON.stringify(scenario)], "study.json", {
        type: "application/json",
      }),
    );
    await waitFor(() =>
      expect(useEquityCalculatorStore.getState().players[0][0]).toEqual(
        card(14, "s"),
      ),
    );
  },
};
