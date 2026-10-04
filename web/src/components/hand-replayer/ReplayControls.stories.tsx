import { knownA11y } from "@/storybook/knownA11y";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { ReplayControls } from "./ReplayControls";
import { seedReplay } from "@/storybook/seedReplay";
import { replayHand } from "@/storybook/fixtures";
import { useHandReplayStore } from "@/stores/useHandReplayStore";

const meta = {
  title: "Replay/Controls",
  component: ReplayControls,
  tags: ["autodocs"],
  beforeEach: () => {
    seedReplay();
  },
} satisfies Meta<typeof ReplayControls>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Start: Story = {
  parameters: knownA11y("replay-controls--start"),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Step forward" }));
    await expect(c.getByText("Action 1 of 12")).toBeVisible();
    await userEvent.keyboard("{ArrowRight}");
    await expect(c.getByText("Action 2 of 12")).toBeVisible();
  },
};
export const Middle: Story = {
  parameters: knownA11y("replay-controls--middle"),
  beforeEach: () => {
    seedReplay({ index: 5 });
  },
};
export const Last: Story = {
  parameters: knownA11y("replay-controls--last"),
  beforeEach: () => {
    seedReplay({ index: 11 });
  },
};
export const Playing: Story = {
  parameters: knownA11y("replay-controls--playing"),
  beforeEach: () => {
    seedReplay();
    useHandReplayStore.setState({ isPlaying: true });
  },
};
export const Speeds: Story = {
  parameters: knownA11y("replay-controls--speeds"),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const speed = c.getAllByRole("slider")[1];
    await userEvent.click(speed);
    await userEvent.keyboard("{End}");
    await expect(c.getByText("0.5x")).toBeVisible();
    await userEvent.keyboard("{Home}");
    await expect(c.getByText("10.0x")).toBeVisible();
  },
};
export const NoActions: Story = {
  parameters: knownA11y("replay-controls--no-actions"),
  beforeEach: () => {
    const hand = replayHand();
    hand.actions = [];
    seedReplay({ hand });
  },
};
