import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { TableActions } from "./TableActions";
import { table } from "@/storybook/fixtures";

const waiting = () => {
  const t = table({
    street: "waiting",
    legal: null,
    actor: null,
    canDeal: true,
  });
  t.seats = t.seats.map((s) => ({
    ...s,
    status: "waiting" as const,
    hasCards: false,
    ready: false,
  }));
  return t;
};
const meta = {
  title: "Poker/TableActions",
  component: TableActions,
  tags: ["autodocs"],
  args: { table: table(), remaining: 25, disabled: false, send: fn() },
} satisfies Meta<typeof TableActions>;
export default meta;
type Story = StoryObj<typeof meta>;
const openRaise: Story["play"] = async ({ canvasElement }) => {
  await userEvent.click(
    within(canvasElement).getByRole("button", { name: /^Raise$/ }),
  );
};
export const Waiting: Story = { args: { table: waiting(), remaining: null } };
export const Ready: Story = {
  args: {
    table: {
      ...waiting(),
      seats: waiting().seats.map((s) => ({ ...s, ready: true })),
    },
    remaining: null,
  },
};
export const Spectator: Story = {
  args: {
    table: table({
      yourSeat: null,
      legal: null,
      seats: table().seats.map((s) => ({ ...s, isYou: false })),
    }),
  },
};
export const CpuThinking: Story = {
  args: { table: table({ actor: 1, legal: null }), remaining: null },
};
export const Folded: Story = {
  args: {
    table: table({
      actor: 1,
      legal: null,
      seats: table().seats.map((s) =>
        s.isYou ? { ...s, status: "folded" } : s,
      ),
    }),
  },
};
export const Check: Story = {
  args: {
    table: table({
      legal: {
        fold: true,
        check: true,
        call: 0,
        minRaiseTo: 20,
        maxRaiseTo: 995,
      },
    }),
  },
};
export const Call: Story = {};
export const AllInCall: Story = {
  args: {
    table: table({
      legal: {
        fold: true,
        check: false,
        call: 995,
        minRaiseTo: null,
        maxRaiseTo: 995,
      },
    }),
  },
};
export const Bet: Story = {
  args: {
    table: table({
      currentBet: 0,
      legal: {
        fold: true,
        check: true,
        call: 0,
        minRaiseTo: 10,
        maxRaiseTo: 995,
      },
    }),
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: /^Bet$/ }),
    );
  },
};
export const Raise: Story = { play: openRaise };
export const NoRaise: Story = {
  args: {
    table: table({
      legal: {
        fold: true,
        check: false,
        call: 5,
        minRaiseTo: null,
        maxRaiseTo: 995,
      },
    }),
  },
};
export const InvalidAmount: Story = {
  play: async (context) => {
    await openRaise!(context);
    const c = within(context.canvasElement);
    await userEvent.clear(c.getByLabelText("Raise to"));
    await userEvent.type(c.getByLabelText("Raise to"), "1");
    await expect(c.getByRole("button", { name: "Raise to 1" })).toBeDisabled();
  },
};
export const Pending: Story = { args: { disabled: true } };
export const Disconnected: Story = {
  args: { disabled: true },
  parameters: {
    docs: {
      description: {
        story:
          "The page owns the reconnect alert. This component disables actions.",
      },
    },
  },
};
export const Closed: Story = { args: { table: table({ closed: true }) } };
export const Rebuy: Story = {
  args: {
    table: {
      ...waiting(),
      seats: waiting().seats.map((s) => (s.isYou ? { ...s, stack: 0 } : s)),
    },
    remaining: null,
  },
};
