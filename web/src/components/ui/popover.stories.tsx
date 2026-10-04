import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "./popover";
import { Button } from "./button";

function Example({
  open = false,
  side = "bottom" as "top" | "right" | "bottom" | "left",
  anchored = false,
  edge = false,
}) {
  return (
    <div
      className={
        edge ? "flex justify-end" : "flex min-h-60 items-center justify-center"
      }
    >
      <Popover defaultOpen={open}>
        {anchored && (
          <PopoverAnchor asChild>
            <span className="mr-8">Seat 1</span>
          </PopoverAnchor>
        )}
        <PopoverTrigger asChild>
          <Button>Player details</Button>
        </PopoverTrigger>
        <PopoverContent side={side} aria-label="Alex player details">
          <PopoverHeader>
            <PopoverTitle>Alex</PopoverTitle>
            <PopoverDescription>Seat 1 · 1,000 chips</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </div>
  );
}
const meta = {
  title: "UI/Popover",
  component: Example,
  tags: ["autodocs", "source-only"],
} satisfies Meta<typeof Example>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Closed: Story = {};
export const Open: Story = { args: { open: true } };
export const Placements: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-12">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Example key={side} open side={side} />
      ))}
    </div>
  ),
};
export const Edge: Story = { args: { open: true, edge: true } };
export const Anchored: Story = { args: { open: true, anchored: true } };
