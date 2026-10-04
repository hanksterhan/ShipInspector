import type { Meta, StoryObj } from "@storybook/react-vite";
import { PokerTable } from "./PokerTable";
import { seedStudy } from "@/storybook/seedStudy";

const meta = {
  title: "Poker/StudyTable",
  component: PokerTable,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  beforeEach: () => {
    seedStudy({ filled: true });
  },
} satisfies Meta<typeof PokerTable>;
export default meta;
type Story = StoryObj<typeof meta>;
export const HeadsUp: Story = {};
export const FourPlayers: Story = {
  beforeEach: () => {
    seedStudy({ seats: [0, 1, 2, 3], filled: true });
  },
};
export const SixPlayers: Story = {
  beforeEach: () => {
    seedStudy({ seats: [0, 1, 2, 3, 4, 5], filled: true });
  },
};
export const EightPlayers: Story = {
  beforeEach: () => {
    seedStudy({ seats: [0, 1, 2, 3, 4, 5, 6, 7], filled: true });
  },
};
export const SparseSeats: Story = {
  beforeEach: () => {
    seedStudy({ seats: [0, 3, 7], filled: true });
  },
};
export const Flop: Story = {
  beforeEach: () => {
    seedStudy({ filled: true, boardCount: 3 });
  },
};
export const Showdown: Story = {
  beforeEach: () => {
    seedStudy({ filled: true, boardCount: 5, result: true });
  },
};
export const SplitPot: Story = {
  beforeEach: () => {
    seedStudy({ filled: true, boardCount: 5, result: true, split: true });
  },
};
