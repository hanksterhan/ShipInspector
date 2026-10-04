import { knownA11y } from "@/storybook/knownA11y";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { delay, http, HttpResponse } from "msw";
import HandReplayerPage from "./HandReplayerPage";

const meta = {
  title: "Pages/HandReplayer",
  component: HandReplayerPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    route: "/hands/replay/storybook-hand-0",
    routePath: "/hands/replay/:handId",
  },
} satisfies Meta<typeof HandReplayerPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const NoHand: Story = {
  parameters: { route: "/hands/replay", routePath: "/hands/replay" },
};
export const Loading: Story = {
  parameters: {
    msw: [
      http.get("*/hands/:id", async () => {
        await delay("infinite");
        return HttpResponse.json({});
      }),
    ],
  },
};
export const Error: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("alert"),
    ).toHaveTextContent("Replay unavailable");
  },
  parameters: {
    msw: [
      http.get("*/hands/:id", () =>
        HttpResponse.json({ error: "Replay unavailable." }, { status: 503 }),
      ),
    ],
  },
};
export const NotFound: Story = {
  parameters: { msw: [http.get("*/hands/:id", () => HttpResponse.json(null))] },
};
export const Loaded: Story = {
  parameters: knownA11y("pages-handreplayer--loaded"),
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("button", { name: "Play" }),
    ).toBeVisible();
  },
};
