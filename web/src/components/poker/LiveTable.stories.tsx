import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import { LiveTable } from "./LiveTable";
import { Button } from "@/components/ui/button";
import { board, card, deck, table, tableSeats } from "@/storybook/fixtures";

const complete = () =>
  table({
    street: "complete",
    board: board(),
    actor: null,
    deadline: null,
    legal: null,
    pot: 120,
    awards: [
      {
        amount: 120,
        winners: [{ seat: 0, amount: 120, hand: "Pair of aces" }],
      },
    ],
    seats: table().seats.map((s) => ({
      ...s,
      cards:
        s.seat === 0
          ? [card(14, "s"), card(14, "d")]
          : [card(13, "s"), card(13, "h")],
    })),
  });
const meta = {
  title: "Poker/LiveTable",
  component: LiveTable,
  tags: ["autodocs"],
  args: { table: table(), remaining: 25 },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof LiveTable>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Waiting: Story = {
  args: {
    table: table({
      street: "waiting",
      actor: null,
      legal: null,
      seats: tableSeats(2).map((s) => ({
        ...s,
        status: "waiting",
        hasCards: false,
      })),
    }),
    remaining: null,
  },
};
export const HeadsUp: Story = {
  args: { table: table({ settings: { ...table().settings, maxPlayers: 2 } }) },
};
export const FullTable: Story = {
  args: { table: table({ seats: tableSeats() }) },
};
export const Spectator: Story = {
  args: {
    table: table({
      yourSeat: null,
      legal: null,
      seats: tableSeats(2).map((s) => ({ ...s, isYou: false, cards: [] })),
    }),
  },
};
export const HiddenCards: Story = {
  args: {
    table: table({ seats: tableSeats(6).map((s) => ({ ...s, cards: [] })) }),
  },
};
export const Flop: Story = {
  args: {
    table: table({ street: "flop", board: board().slice(0, 3), pot: 60 }),
  },
};
export const Turn: Story = {
  args: {
    table: table({ street: "turn", board: board().slice(0, 4), pot: 80 }),
  },
};
export const River: Story = {
  args: { table: table({ street: "river", board: board(), pot: 120 }) },
};
export const Folded: Story = {
  args: {
    table: table({
      seats: tableSeats(4).map((s) =>
        s.seat === 1 ? { ...s, status: "folded", lastAction: "Fold" } : s,
      ),
    }),
  },
};
export const AllIn: Story = {
  args: {
    table: table({
      seats: tableSeats(4).map((s) =>
        s.seat === 1
          ? {
              ...s,
              status: "all-in",
              stack: 0,
              committed: 1000,
              lastAction: "All-in",
            }
          : s,
      ),
    }),
  },
};
export const Winner: Story = { args: { table: complete(), remaining: null } };
export const SplitPot: Story = {
  args: {
    table: {
      ...complete(),
      awards: [
        {
          amount: 120,
          winners: [
            { seat: 0, amount: 60, hand: "Straight" },
            { seat: 1, amount: 60, hand: "Straight" },
          ],
        },
      ],
    },
    remaining: null,
  },
};
export const SidePots: Story = {
  args: {
    table: {
      ...complete(),
      seats: tableSeats(3),
      pot: 240,
      awards: [
        { amount: 120, winners: [{ seat: 0, amount: 120, hand: "Flush" }] },
        { amount: 120, winners: [{ seat: 1, amount: 120, hand: "Straight" }] },
      ],
    },
    remaining: null,
  },
};
export const RedRiver: Story = {
  args: {
    table: table({
      settings: { ...table().settings, gameMode: "red-river-holdem" },
      street: "river",
      board: [...board().slice(0, 4), card(3, "h")],
      riverNumber: 1,
    }),
  },
};
export const ManyRivers: Story = {
  args: {
    table: table({
      settings: { ...table().settings, gameMode: "red-river-holdem" },
      street: "complete",
      actor: null,
      legal: null,
      board: [
        ...board().slice(0, 4),
        card(3, "h"),
        card(4, "d"),
        card(5, "h"),
        card(6, "c"),
      ],
      riverNumber: 4,
      terminalReason: "black-river",
    }),
    remaining: null,
  },
};
export const DeckExhausted: Story = {
  args: {
    table: table({
      settings: { ...table().settings, gameMode: "red-river-holdem" },
      street: "complete",
      actor: null,
      legal: null,
      board: [
        ...board().slice(0, 4),
        ...deck()
          .filter(
            (c) =>
              (c.suit === "h" || c.suit === "d") &&
              !board()
                .slice(0, 4)
                .some((b) => b.rank === c.rank && b.suit === c.suit),
          )
          .slice(0, 15),
      ],
      riverNumber: 15,
      terminalReason: "deck-exhausted",
      drawCapacity: 0,
      seats: tableSeats(),
      dealtPlayerCount: 8,
      burnCount: 17,
    }),
    remaining: null,
  },
};
export const LongNames: Story = {
  args: {
    table: table({
      seats: tableSeats(4).map((s) => ({
        ...s,
        name: `${s.name} with a very long player name`,
      })),
    }),
  },
};
export const DealTransition: Story = {
  render: (args) => {
    const [snapshot, setSnapshot] = useState(
      table({
        street: "waiting",
        actor: null,
        legal: null,
        seats: tableSeats(2).map((s) => ({ ...s, hasCards: false })),
      }),
    );
    return (
      <>
        <Button onClick={() => setSnapshot({ ...args.table, handNumber: 2 })}>
          Deal hand
        </Button>
        <LiveTable {...args} table={snapshot} />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Deal hand" }),
    );
  },
};
