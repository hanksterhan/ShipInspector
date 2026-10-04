import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { BoardCardsSection } from "./BoardCardsSection";
import { seedRecorder } from "@/storybook/seedRecorder";
import { useHandRecorderStore } from "@/stores/useHandRecorderStore";

const meta = {
  title: "Recorder/BoardCards",
  component: BoardCardsSection,
  tags: ["autodocs"],
  args: {
    activeTarget: null,
    onPickCard: fn(),
    onClearCard: (index: number) =>
      useHandRecorderStore.getState().setBoardCard(index, null),
  },
} satisfies Meta<typeof BoardCardsSection>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Flop: Story = {
  beforeEach: () => {
    seedRecorder({ boardCount: 3 });
  },
};
export const Turn: Story = {
  beforeEach: () => {
    seedRecorder({ boardCount: 4 });
  },
};
export const River: Story = {
  beforeEach: () => {
    seedRecorder({ boardCount: 5 });
  },
};
export const Selected: Story = {
  args: { activeTarget: { kind: "board", index: 3 } },
  beforeEach: () => {
    seedRecorder({ boardCount: 4 });
  },
};
