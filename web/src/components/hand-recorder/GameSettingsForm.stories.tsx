import type { Meta, StoryObj } from "@storybook/react-vite";
import { GameSettingsForm } from "./GameSettingsForm";
import { useHandRecorderStore } from "@/stores/useHandRecorderStore";
import { seedRecorder } from "@/storybook/seedRecorder";

const meta = {
  title: "Recorder/GameSettings",
  component: GameSettingsForm,
  tags: ["autodocs"],
} satisfies Meta<typeof GameSettingsForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Filled: Story = {
  beforeEach: () => {
    seedRecorder();
  },
};
export const Invalid: Story = {
  beforeEach: () => {
    seedRecorder();
    useHandRecorderStore.setState({
      validationErrors: {
        "hand.table_size": ["must be between 2 and 9"],
        "hand.button_seat": ["must be within table size"],
        "hand.small_blind": ["must be greater than 0"],
        "hand.big_blind": ["must be greater than small blind"],
        "hand.ante": ["must be 0 or greater"],
      },
    });
  },
};
export const Stakes: Story = {
  beforeEach: () => {
    seedRecorder();
    useHandRecorderStore.setState((s) => ({
      gameSettings: {
        ...s.gameSettings,
        smallBlind: 500,
        bigBlind: 1000,
        ante: 100,
      },
    }));
  },
};
export const TableSizes: Story = {
  beforeEach: () => {
    seedRecorder({ size: 9 });
  },
};
