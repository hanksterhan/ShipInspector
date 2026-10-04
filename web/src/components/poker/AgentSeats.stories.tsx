import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { delay, http, HttpResponse } from "msw";
import { AgentSeats } from "./AgentSeats";
import { table, tableSeats } from "@/storybook/fixtures";
import { mockClipboard } from "@/storybook/mocks/clipboard";

const agent = (extra = {}) => ({
  id: "storybook-agent",
  name: "Riverbot",
  seat: 2,
  expiresAt: Date.now() + 7 * 86400000,
  revoked: false,
  seated: false,
  ...extra,
});
const reserve: StoryObj<typeof AgentSeats>["play"] = async ({
  canvasElement,
}) => {
  const c = within(canvasElement);
  await userEvent.type(c.getByLabelText("Agent name"), "Riverbot");
  await userEvent.click(c.getByRole("button", { name: "Reserve seat" }));
};
const meta = {
  title: "Poker/AgentSeats",
  component: AgentSeats,
  tags: ["autodocs"],
  args: {
    table: table({ street: "waiting", agents: [] }),
    accept: fn(),
    refresh: fn(async () => {}),
  },
  beforeEach: () => mockClipboard(),
  render: (args) => {
    const [snapshot, setSnapshot] = useState(args.table);
    return <AgentSeats {...args} table={snapshot} accept={setSnapshot} />;
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AgentSeats>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Reserved: Story = {
  args: { table: table({ street: "waiting", agents: [agent()] }) },
};
export const Issued: Story = {
  play: async (context) => {
    await reserve!(context);
    await expect(
      await within(context.canvasElement).findByLabelText("Agent credential"),
    ).toHaveValue("storybook-fake-credential");
  },
};
export const CopyFailed: Story = {
  beforeEach: () => mockClipboard(true),
  play: async (context) => {
    await Issued.play!(context);
    const c = within(context.canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Copy credential" }));
    await expect(c.getByRole("alert")).toHaveTextContent(
      "Clipboard access failed",
    );
  },
};
export const Revoked: Story = {
  args: {
    table: table({ street: "waiting", agents: [agent({ revoked: true })] }),
  },
};
export const SeatedRevoked: Story = {
  args: {
    table: table({
      street: "waiting",
      agents: [agent({ revoked: true, seated: true })],
    }),
  },
};
export const Expired: Story = {
  args: {
    table: table({
      street: "waiting",
      agents: [agent({ expiresAt: Date.now() - 86400000 })],
    }),
  },
};
export const Full: Story = {
  args: { table: table({ street: "waiting", seats: tableSeats() }) },
};
export const Busy: Story = {
  parameters: {
    msw: [
      http.post("*/api/tables/:id/agents", async () => {
        await delay("infinite");
        return HttpResponse.json({});
      }),
    ],
  },
  play: reserve,
};
export const Closed: Story = {
  args: { table: table({ street: "waiting", closed: true }) },
};
export const Error: Story = {
  parameters: {
    msw: [
      http.post("*/api/tables/:id/agents", () =>
        HttpResponse.json({ error: "Agent seat unavailable" }, { status: 409 }),
      ),
    ],
  },
  play: async (context) => {
    await reserve!(context);
    await expect(
      await within(context.canvasElement).findByRole(
        "alert",
        {},
        { timeout: 3000 },
      ),
    ).toHaveTextContent("Agent seat unavailable");
  },
};
export const Copied: Story = {
  play: async (context) => {
    await Issued.play!(context);
    const c = within(context.canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Copy credential" }));
    await expect(
      await c.findByRole("button", { name: "Copied" }),
    ).toBeVisible();
  },
};
export const Dismissed: Story = {
  play: async (context) => {
    await Issued.play!(context);
    const c = within(context.canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Dismiss" }));
    await expect(
      c.queryByLabelText("Agent credential"),
    ).not.toBeInTheDocument();
  },
};
export const McpOpen: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByText("Connect with MCP"));
    await expect(c.getByText("poker_get_table")).toBeVisible();
  },
};
export const RevokeAction: Story = {
  ...Reserved,
  parameters: {
    msw: [
      http.post("*/api/tables/:id/revoke-agent", () =>
        HttpResponse.json(
          table({ street: "waiting", agents: [agent({ revoked: true })] }),
        ),
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Revoke" }));
    await expect(await c.findByText("Revoked")).toBeVisible();
  },
};
export const RemoveAction: Story = {
  ...SeatedRevoked,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Remove seat" }));
    await waitFor(() =>
      expect(c.queryByText("Riverbot")).not.toBeInTheDocument(),
    );
  },
};
