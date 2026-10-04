import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { http, HttpResponse } from "msw";
import { Button } from "@/components/ui/button";
import { ReplayControls } from "@/components/hand-replayer/ReplayControls";
import HandRecorderPage from "@/pages/HandRecorderPage";
import TablePage from "@/pages/TablePage";
import SPRCalculatorPage from "@/pages/utilities/SPRCalculatorPage";
import { useHandRecorderStore } from "@/stores/useHandRecorderStore";
import { useHandReplayStore } from "@/stores/useHandReplayStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { seedRecorder } from "./seedRecorder";
import { seedReplay } from "./seedReplay";
import { table } from "./fixtures";
import { get } from "./mocks/storage";
import { resetStory } from "./reset";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
function SwitchView({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(true);
  return (
    <>
      <Button onClick={() => setShow((value) => !value)}>Switch view</Button>
      {show ? children : <SPRCalculatorPage />}
    </>
  );
}
const meta = { title: "Shell/Isolation", tags: ["autodocs"] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const RecorderDraft: Story = {
  beforeEach: () => {
    seedRecorder({ size: 2 });
    useSettingsStore.setState({ wizardMode: false });
  },
  render: () => (
    <SwitchView>
      <HandRecorderPage />
    </SwitchView>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const input = await c.findAllByRole("textbox", { name: "Name" });
    await userEvent.clear(input[0]);
    await userEvent.type(input[0], "Pending draft from A");
    await userEvent.click(c.getByRole("button", { name: "Switch view" }));
    await expect(
      await c.findByRole("heading", { name: "SPR Calculator", level: 1 }),
    ).toBeVisible();
    await resetStory();
    await wait(650);
    await expect(await get("hand-recorder-draft-v1")).toBeUndefined();
    await expect(
      useHandRecorderStore
        .getState()
        .players.every((player) => player.displayName === ""),
    ).toBe(true);
    await userEvent.click(c.getByRole("button", { name: "Switch view" }));
    await expect(
      await c.findByRole("button", { name: "Show all fields" }),
    ).toBeVisible();
    await expect(c.queryByText("Draft saved")).not.toBeInTheDocument();
    await userEvent.click(c.getByRole("button", { name: "Switch view" }));
  },
};
export const ReplayTimersAndKeys: Story = {
  beforeEach: () => {
    seedReplay();
  },
  render: () => (
    <SwitchView>
      <ReplayControls />
    </SwitchView>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    useHandReplayStore.getState().setPlaybackSpeed(100);
    await userEvent.click(c.getByRole("button", { name: "Play" }));
    await waitFor(() =>
      expect(
        useHandReplayStore.getState().currentActionIndex,
      ).toBeGreaterThanOrEqual(0),
    );
    await userEvent.click(c.getByRole("button", { name: "Switch view" }));
    await expect(
      await c.findByRole("heading", { name: "SPR Calculator", level: 1 }),
    ).toBeVisible();
    await resetStory();
    seedReplay({ index: 5 });
    await userEvent.keyboard("{ArrowRight}");
    await wait(350);
    await expect(useHandReplayStore.getState().currentActionIndex).toBe(5);
    await expect(useHandReplayStore.getState().isPlaying).toBe(false);
    await userEvent.click(c.getByRole("button", { name: "Switch view" }));
    await expect(c.getByText("Action 6 of 12")).toBeVisible();
    await userEvent.keyboard("{ArrowRight}");
    await expect(c.getByText("Action 7 of 12")).toBeVisible();
    await userEvent.click(c.getByRole("button", { name: "Switch view" }));
  },
};
let reads = 0;
export const LivePolling: Story = {
  beforeEach: () => {
    reads = 0;
  },
  parameters: {
    route: "/tables/storybook-table",
    routePath: "/tables/:tableId",
    msw: [
      http.get("*/api/tables/:id", () => {
        reads++;
        return HttpResponse.json(table());
      }),
    ],
  },
  render: () => (
    <SwitchView>
      <TablePage />
    </SwitchView>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(
      await c.findByRole("button", { name: "Invite" }),
    ).toBeVisible();
    await waitFor(() => expect(reads).toBeGreaterThanOrEqual(2), {
      timeout: 7000,
    });
    await userEvent.click(c.getByRole("button", { name: "Switch view" }));
    await expect(
      await c.findByRole("heading", { name: "SPR Calculator", level: 1 }),
    ).toBeVisible();
    const stopped = reads;
    await resetStory();
    await wait(1100);
    await expect(reads).toBe(stopped);
    await userEvent.click(c.getByRole("button", { name: "Switch view" }));
    await expect(
      await c.findByRole("button", { name: "Invite" }),
    ).toBeVisible();
    await expect(reads).toBeGreaterThan(stopped);
    await userEvent.click(c.getByRole("button", { name: "Switch view" }));
  },
};
