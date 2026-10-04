import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReplayBoardCards } from "./ReplayBoardCards";
import { seedReplay } from "@/storybook/seedReplay";

const meta = {
  title: "Replay/BoardCards",
  component: ReplayBoardCards,
  tags: ["autodocs"],
  beforeEach: () => {
    seedReplay();
  },
} satisfies Meta<typeof ReplayBoardCards>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Flop: Story = {
  beforeEach: () => {
    seedReplay({ index: 3 });
  },
};
export const Turn: Story = {
  beforeEach: () => {
    seedReplay({ index: 7 });
  },
};
export const River: Story = {
  beforeEach: () => {
    seedReplay({ index: 9 });
  },
};
