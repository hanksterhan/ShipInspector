import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { CardSlot } from "./CardSlot";
import { card } from "@/storybook/fixtures";

const meta = {
  title: "Recorder/CardSlot",
  component: CardSlot,
  tags: ["autodocs"],
  args: { card: null, onSelect: fn(), onClear: fn(), ariaLabel: "Hero card" },
} satisfies Meta<typeof CardSlot>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Filled: Story = { args: { card: card(14, "h") } };
export const Selected: Story = {
  args: { card: card(14, "h"), isActive: true },
};
export const Medium: Story = { args: { card: card(14, "h"), size: "md" } };
export const Disabled: Story = {
  args: { card: card(14, "h"), disabled: true },
};
