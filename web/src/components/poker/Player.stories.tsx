import type { Meta, StoryObj } from "@storybook/react-vite";
import { Player } from "./Player";
import { seedStudy } from "@/storybook/seedStudy";
import { useEquityCalculatorStore } from "@/stores/useEquityCalculatorStore";

const meta = {
  title: "Poker/Player",
  component: Player,
  tags: ["autodocs"],
  args: { playerIndex: 0 },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Player>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Partial: Story = {
  beforeEach: () => {
    seedStudy({ filled: true });
    const players = useEquityCalculatorStore
      .getState()
      .players.map((p) => [...p] as typeof p);
    players[0][1] = null;
    useEquityCalculatorStore.setState({ players });
    useEquityCalculatorStore.getState().dispose();
  },
};
export const Complete: Story = {
  beforeEach: () => {
    seedStudy({ seats: [0, 1, 2], filled: true, result: true });
  },
};
export const Selected: Story = {
  beforeEach: () => {
    seedStudy({ filled: true });
    useEquityCalculatorStore.setState({ pickerOpen: true });
  },
};
export const Winning: Story = {
  beforeEach: () => {
    seedStudy({ filled: true, boardCount: 5, result: true });
  },
};
export const MinimumPlayers: Story = {};
export const HighestSeat: Story = {
  args: { playerIndex: 7 },
  beforeEach: () => {
    seedStudy({ seats: [0, 7], filled: true });
  },
};
