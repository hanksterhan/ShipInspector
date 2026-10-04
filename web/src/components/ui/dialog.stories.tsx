import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

function Example({
  open = false,
  close = true,
  long = false,
  footerClose = false,
}) {
  return (
    <Dialog defaultOpen={open}>
      <DialogTrigger asChild>
        <Button>Hand details</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={close}>
        <DialogHeader>
          <DialogTitle>Hand details</DialogTitle>
          <DialogDescription>6 players · 5/10 blinds</DialogDescription>
        </DialogHeader>
        <div className="max-h-64 overflow-auto" tabIndex={long ? 0 : undefined}>
          {long ? (
            Array.from({ length: 30 }, (_, n) => (
              <p key={n}>Action {n + 1}: Alex calls 10.</p>
            ))
          ) : (
            <p>Alex wins 60 with a pair of aces.</p>
          )}
        </div>
        <DialogFooter showCloseButton={footerClose}>
          <DialogClose asChild>
            <Button>Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
const meta = {
  title: "UI/Dialog",
  component: Example,
  tags: ["autodocs"],
} satisfies Meta<typeof Example>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", {
      name: "Hand details",
    });
    await userEvent.click(trigger);
    await waitFor(() =>
      expect(within(document.body).getByRole("dialog")).toBeVisible(),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
export const Open: Story = { args: { open: true } };
export const NoClose: Story = { args: { open: true, close: false } };
export const LongContent: Story = { args: { open: true, long: true } };
export const FooterClose: Story = { args: { open: true, footerClose: true } };
