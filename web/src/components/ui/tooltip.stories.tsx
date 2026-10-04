import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "./tooltip";
import { Button } from "./button";

function Example({
  open = false,
  side = "top" as "top" | "right" | "bottom" | "left",
}) {
  return (
    <TooltipProvider>
      <Tooltip defaultOpen={open}>
        <TooltipTrigger asChild>
          <Button variant="outline">Replay hand</Button>
        </TooltipTrigger>
        <TooltipContent side={side}>Open the hand replay</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
const meta = {
  title: "UI/Tooltip",
  component: Example,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="flex min-h-48 items-center justify-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Example>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Hover: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole("button"));
  },
};
export const Focus: Story = {
  play: async ({ canvasElement }) => {
    within(canvasElement).getByRole("button").focus();
  },
};
export const Placements: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-24">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Example key={side} open side={side} />
      ))}
    </div>
  ),
};
