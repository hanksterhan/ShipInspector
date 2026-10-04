import { knownA11y } from "@/storybook/knownA11y";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReplayTable } from "./ReplayTable";
import { seedReplay } from "@/storybook/seedReplay";
import { replayHand } from "@/storybook/fixtures";

const meta = { title: "Replay/Table", component: ReplayTable, tags: ["autodocs"], args: { hand: replayHand() }, parameters: { layout: "fullscreen" }, beforeEach: ({ args }) => { seedReplay({ hand: args.hand }); } } satisfies Meta<typeof ReplayTable>;
export default meta;
type Story = StoryObj<typeof meta>;
export const HeadsUp: Story = { parameters: knownA11y("replay-table--heads-up"), args: { hand: replayHand(2) } };
export const FullTable: Story = { parameters: knownA11y("replay-table--full-table"), args: { hand: replayHand(9) } };
export const Preflop: Story = { parameters: knownA11y("replay-table--preflop"), beforeEach: ({ args }) => { seedReplay({ hand: args.hand, index: 2 }); } };
export const Flop: Story = { parameters: knownA11y("replay-table--flop"), beforeEach: ({ args }) => { seedReplay({ hand: args.hand, index: 3 }); } };
export const Turn: Story = { parameters: knownA11y("replay-table--turn"), beforeEach: ({ args }) => { seedReplay({ hand: args.hand, index: 7 }); } };
export const River: Story = { parameters: knownA11y("replay-table--river"), beforeEach: ({ args }) => { seedReplay({ hand: args.hand, index: 9 }); } };
export const Complete: Story = { parameters: knownA11y("replay-table--complete"), beforeEach: ({ args }) => { seedReplay({ hand: args.hand, index: 11 }); } };
export const SplitPot: Story = { parameters: knownA11y("replay-table--split-pot"), beforeEach: ({ args }) => { const hand = structuredClone(args.hand); hand.actions[11].amount = 30; hand.actions.push({ ...hand.actions[11], id: "split-award", sequence_index: 12, actor_seat: 1 }); seedReplay({ hand, index: 12 }); } };
