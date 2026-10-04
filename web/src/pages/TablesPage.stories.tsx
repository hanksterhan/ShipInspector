import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { delay, http, HttpResponse } from "msw";
import TablesPage from "./TablesPage";

const meta = {
  title: "Pages/Tables",
  component: TablesPage,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", route: "/tables", routePath: "/tables" },
} satisfies Meta<typeof TablesPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Loading: Story = {
  parameters: {
    msw: [
      http.get("*/api/tables", async () => {
        await delay("infinite");
        return HttpResponse.json({});
      }),
    ],
  },
};
export const Empty: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("button", {
        name: "Create your first table",
      }),
    ).toBeVisible();
  },
  parameters: {
    msw: [http.get("*/api/tables", () => HttpResponse.json({ tables: [] }))],
  },
};
export const Populated: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("link", { name: /Friday table/ }),
    ).toBeVisible();
  },
};
export const Error: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("alert"),
    ).toHaveTextContent("Tables unavailable");
  },
  parameters: {
    msw: [
      http.get("*/api/tables", () =>
        HttpResponse.json({ error: "Tables unavailable." }, { status: 503 }),
      ),
    ],
  },
};
export const Create: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Create table" }));
    await userEvent.selectOptions(
      c.getByLabelText("Game mode"),
      "red-river-holdem",
    );
    await userEvent.selectOptions(c.getByLabelText("Seats"), "8");
  },
};
export const Join: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(
      within(canvasElement).getByLabelText("Join with an invite"),
      "https://example.test/tables/12345678-1234-1234-1234-123456789abc",
    );
  },
};
export const InvalidInvite: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.type(
      c.getByLabelText("Join with an invite"),
      "invalid-table",
    );
    await userEvent.click(c.getByRole("button", { name: "Join table" }));
    await expect(c.getByRole("alert")).toHaveTextContent("Paste a valid table");
  },
};
export const Practice: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(
      c.getByRole("button", { name: "Set up an agent table" }),
    );
    await expect(c.getByLabelText("Take a seat")).not.toBeChecked();
  },
};
