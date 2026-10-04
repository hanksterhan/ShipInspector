import type { Meta, StoryObj } from "@storybook/react-vite";
import { TurnTimer } from "./TurnTimer";

const meta = { title: "Poker/TurnTimer", component: TurnTimer, tags: ["autodocs"], args: { remaining: 25, duration: 30, name: "Alex", isYou: true }, decorators: [(Story) => <div className="max-w-md"><Story /></div>] } satisfies Meta<typeof TurnTimer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Normal: Story = {};
export const Warning: Story = { args: { remaining: 10 } };
export const Critical: Story = { args: { remaining: 5 } };
export const FinalSecond: Story = { args: { remaining: 1 } };
export const Expired: Story = { args: { remaining: 0 } };
export const Compact: Story = { args: { remaining: 5, compact: true } };
export const Opponent: Story = { args: { remaining: 10, isYou: false } };
export const LongName: Story = { args: { isYou: false, name: "Alex with a very long player name" } };
