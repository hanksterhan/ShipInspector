import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { delay, http, HttpResponse } from "msw";
import TablePage from "./TablePage";
import { board, table, tableSeats } from "@/storybook/fixtures";
import type { TableView } from "@common/interfaces/tableInterfaces";
import { mockClipboard } from "@/storybook/mocks/clipboard";

const waiting = () =>
  table({
    street: "waiting",
    actor: null,
    deadline: null,
    legal: null,
    canDeal: true,
    seats: tableSeats(2).map((seat) => ({
      ...seat,
      status: "waiting",
      hasCards: false,
    })),
  });
const snapshot = (make: () => TableView) => ({
  msw: [http.get("*/api/tables/:id", () => HttpResponse.json(make()))],
});
const loaded: StoryObj<typeof TablePage>["play"] = async ({
  canvasElement,
}) => {
  await expect(
    await within(canvasElement).findByRole("button", { name: "Invite" }),
  ).toBeVisible();
};
const meta = {
  title: "Pages/Table",
  component: TablePage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    route: "/tables/storybook-table",
    routePath: "/tables/:tableId",
  },
  beforeEach: () => mockClipboard(),
} satisfies Meta<typeof TablePage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Loading: Story = {
  parameters: {
    msw: [
      http.get("*/api/tables/:id", async () => {
        await delay("infinite");
        return HttpResponse.json({});
      }),
    ],
  },
};
export const Waiting: Story = { parameters: snapshot(waiting), play: loaded };
export const Active: Story = { play: loaded };
export const Spectator: Story = {
  parameters: snapshot(() =>
    table({
      yourSeat: null,
      isOwner: false,
      legal: null,
      seats: tableSeats(2).map((seat) => ({
        ...seat,
        cards: [],
        isYou: false,
      })),
    }),
  ),
  play: loaded,
};
export const Join: Story = {
  parameters: {
    msw: [
      http.get("*/api/tables/:id", () =>
        HttpResponse.json({ error: "Join this table first." }, { status: 403 }),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("button", { name: "Join table" }),
    ).toBeVisible();
  },
};
export const Unavailable: Story = {
  parameters: {
    msw: [
      http.get("*/api/tables/:id", () =>
        HttpResponse.json({ error: "Table not found." }, { status: 404 }),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText("Table unavailable"),
    ).toBeVisible();
  },
};
export const NewerRules: Story = {
  parameters: snapshot(() => table({ rulesVersion: 999 })),
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("button", {
        name: "Reload table",
      }),
    ).toBeVisible();
  },
};
let reads = 0;
export const Disconnected: Story = {
  beforeEach: () => {
    reads = 0;
  },
  parameters: {
    msw: [
      http.get("*/api/tables/:id", () =>
        ++reads === 1
          ? HttpResponse.json(table())
          : HttpResponse.json({ error: "Connection lost." }, { status: 503 }),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(
        "Reconnecting. The turn clock continues.",
        {},
        { timeout: 7000 },
      ),
    ).toBeVisible();
  },
};
export const CommandError: Story = {
  parameters: {
    msw: [
      http.post("*/api/tables/:id/commands", () =>
        HttpResponse.json(
          { error: "This action is no longer legal." },
          { status: 409 },
        ),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(await c.findByRole("button", { name: "Fold" }));
    await expect(await c.findByRole("alert")).toHaveTextContent(
      "no longer legal",
    );
  },
};
export const UncertainRetry: Story = {
  parameters: {
    msw: [
      http.post("*/api/tables/:id/commands", () =>
        HttpResponse.json(
          { error: "The action result is uncertain." },
          { status: 503 },
        ),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(await c.findByRole("button", { name: "Fold" }));
    await expect(
      await c.findByRole("button", { name: "Retry same action" }),
    ).toBeVisible();
  },
};
export const Complete: Story = {
  parameters: snapshot(() =>
    table({
      street: "complete",
      board: board(),
      actor: null,
      legal: null,
      deadline: null,
      awards: [
        {
          amount: 120,
          winners: [{ seat: 0, amount: 120, hand: "Pair of aces" }],
        },
      ],
    }),
  ),
  play: loaded,
};
export const CpuSheet: Story = {
  parameters: snapshot(waiting),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      await within(canvasElement).findByRole("button", { name: "CPU players" }),
    );
    await expect(
      await within(document.body).findByRole("dialog"),
    ).toBeVisible();
  },
};
export const AgentSheet: Story = {
  parameters: snapshot(waiting),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      await within(canvasElement).findByRole("button", { name: "Agent seats" }),
    );
    await expect(
      await within(document.body).findByRole("dialog"),
    ).toBeVisible();
  },
};
export const Closed: Story = {
  parameters: snapshot(() => ({ ...waiting(), closed: true })),
  play: loaded,
};
export const InviteCopied: Story = {
  play: async (context) => {
    await loaded!(context);
    const c = within(context.canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Invite" }));
    await expect(
      await c.findByRole("button", { name: "Link copied" }),
    ).toBeVisible();
  },
};
export const CopyFailed: Story = {
  beforeEach: () => mockClipboard(true),
  play: async (context) => {
    await loaded!(context);
    const c = within(context.canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Invite" }));
    await expect(await c.findByRole("alert")).toHaveTextContent(
      "Copy the table link",
    );
  },
};
export const RedRiverRules: Story = {
  parameters: snapshot(() =>
    table({
      settings: { ...table().settings, gameMode: "red-river-holdem" },
      street: "river",
      board: [...board().slice(0, 4), { rank: 3, suit: "h" }],
      riverNumber: 1,
    }),
  ),
  play: async (context) => {
    await loaded!(context);
    const c = within(context.canvasElement);
    await userEvent.click(c.getByText("Red River rules"));
    await expect(c.getByText(/Bet on each river/)).toBeVisible();
  },
};
export const DeckExhausted: Story = {
  parameters: snapshot(() =>
    table({
      street: "complete",
      settings: { ...table().settings, gameMode: "red-river-holdem" },
      actor: null,
      deadline: null,
      legal: null,
      terminalReason: "deck-exhausted",
      events: [],
    }),
  ),
  play: loaded,
};
