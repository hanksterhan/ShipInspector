import type { Meta, StoryObj } from "@storybook/react-vite";
import { AddPlayerButton } from "./AddPlayerButton";
import { seedStudy } from "@/storybook/seedStudy";

const meta = {
  title: "Poker/AddPlayerButton",
  component: AddPlayerButton,
  tags: ["autodocs"],
  args: { playerIndex: 2 },
} satisfies Meta<typeof AddPlayerButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const AtLimit: Story = {
  args: { playerIndex: 7 },
  beforeEach: () => {
    seedStudy({ seats: [0, 1, 2, 3, 4, 5, 6, 7] });
  },
};
