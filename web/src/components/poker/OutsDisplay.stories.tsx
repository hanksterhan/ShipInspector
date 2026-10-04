import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CalculateOutsResponse } from "@common/interfaces";
import { OutsDisplay } from "./OutsDisplay";
import { card } from "@/storybook/fixtures";

const data: CalculateOutsResponse = {
  suppressed: null,
  win_outs: [],
  tie_outs: [],
  baseline_win: 0.25,
  baseline_tie: 0.05,
  baseline_lose: 0.7,
  total_river_cards: 44,
};
const meta = {
  title: "Poker/OutsDisplay",
  component: OutsDisplay,
  tags: ["autodocs"],
  args: { data, loading: false, error: null },
} satisfies Meta<typeof OutsDisplay>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Loading: Story = { args: { loading: true } };
export const Error: Story = { args: { error: "Outs service unavailable" } };
export const Suppressed: Story = {
  args: {
    data: {
      ...data,
      suppressed: {
        reason: "Hero already wins on every river card",
        baseline_win: 1,
        baseline_tie: 0,
      },
    },
  },
};
export const WinOuts: Story = {
  args: { data: { ...data, win_outs_cards: [card(14, "h"), card(14, "c")] } },
};
export const TieOuts: Story = {
  args: { data: { ...data, tie_outs_cards: [card(2, "c"), card(2, "d")] } },
};
export const Both: Story = {
  args: {
    data: {
      ...data,
      win_outs_cards: [card(14, "h"), card(14, "c")],
      tie_outs_cards: [card(2, "c"), card(2, "d")],
    },
  },
};
export const NoOuts: Story = {};
