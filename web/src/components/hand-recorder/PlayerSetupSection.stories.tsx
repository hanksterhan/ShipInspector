import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { PlayerSetupSection } from "./PlayerSetupSection";
import { seedRecorder } from "@/storybook/seedRecorder";
import { useHandRecorderStore } from "@/stores/useHandRecorderStore";

const meta = {
  title: "Recorder/PlayerSetup",
  component: PlayerSetupSection,
  tags: ["autodocs"],
  args: {
    activeTarget: null,
    onPickCard: fn(),
    onClearCard: (seat: number, index: 0 | 1) =>
      useHandRecorderStore.getState().setPlayerHoleCard(seat, index, null),
  },
  beforeEach: () => {
    seedRecorder();
  },
} satisfies Meta<typeof PlayerSetupSection>;
export default meta;
type Story = StoryObj<typeof meta>;
export const HeadsUp: Story = {
  beforeEach: () => {
    seedRecorder({ size: 2 });
  },
};
export const NinePlayers: Story = {
  beforeEach: () => {
    seedRecorder({ size: 9 });
  },
};
export const Filled: Story = {};
export const Invalid: Story = {
  beforeEach: () => {
    seedRecorder();
    useHandRecorderStore.setState({
      validationErrors: {
        players: [
          "one hero is required",
          "seat 1 name is required",
          "seat 2 stack must be greater than 0",
        ],
      },
    });
  },
};
export const Inactive: Story = {
  beforeEach: () => {
    seedRecorder({ filled: false });
  },
};
export const Hero: Story = {
  beforeEach: () => {
    seedRecorder();
    useHandRecorderStore.getState().setHero(2);
  },
};
export const Dealer: Story = {
  beforeEach: () => {
    seedRecorder();
    useHandRecorderStore.getState().setButtonSeat(2);
  },
};
export const LongNames: Story = {
  beforeEach: () => {
    seedRecorder();
    useHandRecorderStore.setState((s) => ({
      players: s.players.map((p) => ({
        ...p,
        displayName: `${p.displayName} with a very long player name`,
      })),
    }));
  },
};
export const Selected: Story = {
  args: { activeTarget: { kind: "player", seatIndex: 0, cardIndex: 0 } },
};
