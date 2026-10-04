import { knownA11y } from "@/storybook/knownA11y";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Crown } from "lucide-react";
import { Badge } from "./badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "Ready" },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Variants: Story = {
  parameters: knownA11y("ui-badge--variants"),
  render: () => (
    <div className="flex flex-wrap gap-4">
      {(
        [
          "default",
          "secondary",
          "destructive",
          "outline",
          "ghost",
          "link",
        ] as const
      ).map((variant) => (
        <Badge key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  ),
};
export const Icon: Story = {
  args: {
    children: (
      <>
        <Crown />
        Winner
      </>
    ),
  },
};
export const AsLink: Story = {
  render: () => (
    <Badge asChild>
      <a href="#main-content">Hand details</a>
    </Badge>
  ),
};
export const LongLabel: Story = {
  args: { children: "Waiting for the remaining players" },
};
