import { knownA11y } from "@/storybook/knownA11y";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { delay, http, HttpResponse } from "msw";
import HandRecorderPage from "./HandRecorderPage";
import { seedRecorder } from "@/storybook/seedRecorder";
import { useHandRecorderStore } from "@/stores/useHandRecorderStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { holdTimeouts } from "@/storybook/mocks/clock";
import { set } from "@/storybook/mocks/storage";

function valid() {
  seedRecorder({ size: 2, boardCount: 3 });
  useHandRecorderStore.getState().autoPostBlinds();
}
const save: StoryObj<typeof HandRecorderPage>["play"] = async ({
  canvasElement,
}) => {
  const c = within(canvasElement);
  const button = await c.findByRole("button", { name: "Save Hand" });
  await waitFor(() => expect(button).toBeEnabled());
  await userEvent.click(button);
};
const meta = {
  title: "Pages/HandRecorder",
  component: HandRecorderPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    route: "/hands/record",
    routePath: "/hands/record",
  },
} satisfies Meta<typeof HandRecorderPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Wizard: Story = {};
export const AllFields: Story = {
  parameters: knownA11y("pages-handrecorder--all-fields"),
  beforeEach: () => {
    valid();
    useSettingsStore.setState({ wizardMode: false });
  },
};
export const Draft: Story = {
  beforeEach: async () => {
    valid();
    const { gameSettings, players, actions, currentStreet } =
      useHandRecorderStore.getState();
    await set("hand-recorder-draft-v1", {
      savedAt: Date.now(),
      draft: { gameSettings, players, actions, currentStreet },
    });
  },
};
export const Invalid: Story = {
  parameters: knownA11y("pages-handrecorder--invalid"),
  beforeEach: () => {
    useSettingsStore.setState({ wizardMode: false });
    useHandRecorderStore.getState().validateSetup();
  },
};
export const Saving: Story = {
  beforeEach: valid,
  parameters: {
    msw: [
      http.post("*/hands", async () => {
        await delay("infinite");
        return HttpResponse.json({});
      }),
    ],
  },
  play: save,
};
export const SaveFailed: Story = {
  beforeEach: () => {
    valid();
    return holdTimeouts([4000]);
  },
  parameters: {
    msw: [
      http.post("*/hands", () =>
        HttpResponse.json({ error: "Save unavailable" }, { status: 503 }),
      ),
    ],
  },
  play: async (context) => {
    await save!(context);
    await expect(
      await within(context.canvasElement).findByRole("alert"),
    ).toHaveTextContent("Failed to save hand");
  },
};
export const Saved: Story = {
  beforeEach: () => {
    valid();
    return holdTimeouts([600, 4000]);
  },
  parameters: { heldTimers: [600, 4000] },
  play: async (context) => {
    await save!(context);
    await expect(
      await within(context.canvasElement).findByRole("alert"),
    ).toHaveTextContent("Hand saved");
  },
};
export const WizardPlayers: Story = {
  beforeEach: valid,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("tab", { name: "2. Players" }));
    await expect(c.getByText("Step 2 of 4")).toBeVisible();
  },
};
export const WizardActions: Story = {
  parameters: knownA11y("pages-handrecorder--wizard-actions"),
  beforeEach: valid,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("tab", { name: "3. Actions" }));
    await expect(c.getByText("Step 3 of 4")).toBeVisible();
  },
};
export const WizardReview: Story = {
  parameters: knownA11y("pages-handrecorder--wizard-review"),
  beforeEach: valid,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("tab", { name: "4. Review" }));
    await expect(c.getByText("Step 4 of 4")).toBeVisible();
  },
};
export const PickerOpen: Story = {
  beforeEach: valid,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("tab", { name: "4. Review" }));
    await userEvent.click(
      c.getByRole("button", { name: /^Select flop card 1:/ }),
    );
    await expect(
      await within(document.body).findByRole("dialog"),
    ).toBeVisible();
  },
};
