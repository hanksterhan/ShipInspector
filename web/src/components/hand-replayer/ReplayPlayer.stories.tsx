import { knownA11y } from "@/storybook/knownA11y";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReplayPlayer } from "./ReplayPlayer";
import { seedReplay } from "@/storybook/seedReplay";
import { replayHand } from "@/storybook/fixtures";

const meta = {
  title: "Replay/Player",
  component: ReplayPlayer,
  tags: ["autodocs"],
  args: { seatIndex: 1 },
  beforeEach: () => {
    seedReplay();
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReplayPlayer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Hidden: Story = { parameters: knownA11y("replay-player--hidden") };
export const Revealed: Story = {
  args: { seatIndex: 0 },
  beforeEach: () => {
    seedReplay({ index: 10 });
  },
};
export const Hero: Story = {
  parameters: knownA11y("replay-player--hero"),
  args: { seatIndex: 0 },
};
export const Dealer: Story = {
  parameters: knownA11y("replay-player--dealer"),
  args: { seatIndex: 0 },
};
export const Folded: Story = {
  parameters: knownA11y("replay-player--folded"),
  beforeEach: () => {
    const hand = replayHand();
    hand.actions[0] = {
      ...hand.actions[0],
      action_type: "FOLD",
      actor_seat: 1,
      amount: null,
    };
    seedReplay({ hand, index: 0 });
  },
};
export const AllIn: Story = {
  parameters: knownA11y("replay-player--all-in"),
  beforeEach: () => {
    const hand = replayHand();
    hand.actions[0] = {
      ...hand.actions[0],
      action_type: "ALL_IN",
      actor_seat: 1,
      amount: 1000,
    };
    seedReplay({ hand, index: 0 });
  },
};
export const Winner: Story = {
  args: { seatIndex: 0 },
  beforeEach: () => {
    seedReplay({ index: 11 });
  },
};
export const LongName: Story = {
  parameters: knownA11y("replay-player--long-name"),
  beforeEach: () => {
    const hand = replayHand();
    hand.players[1].display_name = "Marina with a very long player name";
    seedReplay({ hand });
  },
};
