import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "./sheet";
import { Button } from "./button";

function Example({
  open = false,
  side = "right" as "right" | "left" | "top" | "bottom",
  close = true,
  long = false,
}) {
  return (
    <Sheet defaultOpen={open}>
      <SheetTrigger asChild>
        <Button>Table settings</Button>
      </SheetTrigger>
      <SheetContent side={side} showCloseButton={close}>
        <SheetHeader>
          <SheetTitle>Table settings</SheetTitle>
          <SheetDescription>Friday table · 5 / 10</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-4" tabIndex={long ? 0 : undefined}>
          {long ? (
            Array.from({ length: 40 }, (_, i) => (
              <p key={i}>Seat {i + 1}: 1,000 chips</p>
            ))
          ) : (
            <p>Six players</p>
          )}
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button>Done</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
const meta = {
  title: "UI/Sheet",
  component: Example,
  tags: ["autodocs"],
} satisfies Meta<typeof Example>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Closed: Story = {};
export const Right: Story = { args: { open: true } };
export const Left: Story = { args: { open: true, side: "left" } };
export const Top: Story = { args: { open: true, side: "top" } };
export const Bottom: Story = { args: { open: true, side: "bottom" } };
export const NoClose: Story = { args: { open: true, close: false } };
export const LongContent: Story = { args: { open: true, long: true } };
