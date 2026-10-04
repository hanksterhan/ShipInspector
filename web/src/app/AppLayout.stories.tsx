import { knownA11y } from "@/storybook/knownA11y";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Route, Routes } from "react-router-dom";
import AppLayout from "./AppLayout";
import AuthGuard from "./AuthGuard";
import EquityCalculatorPage from "@/pages/EquityCalculatorPage";
import HandRecorderPage from "@/pages/HandRecorderPage";
import HandLibraryPage from "@/pages/HandLibraryPage";
import TablesPage from "@/pages/TablesPage";
import PotOddsCalculatorPage from "@/pages/utilities/PotOddsCalculatorPage";
import SPRCalculatorPage from "@/pages/utilities/SPRCalculatorPage";
import SignInPage from "@/pages/SignInPage";
import TablePage from "@/pages/TablePage";
import HandReplayerPage from "@/pages/HandReplayerPage";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { setAuthState } from "@/storybook/mocks/clerk";

function Shell() {
  useKeyboardShortcuts();
  return (
    <Routes>
      <Route path="/" element={<SignInPage />} />
      <Route element={<AuthGuard />}>
        <Route element={<AppLayout />}>
          <Route path="/equity-calculator" element={<EquityCalculatorPage />} />
          <Route path="/hands/record" element={<HandRecorderPage />} />
          <Route path="/hands/library" element={<HandLibraryPage />} />
          <Route path="/tables" element={<TablesPage />} />
          <Route path="/tables/:tableId" element={<TablePage />} />
          <Route path="/hands/replay/:handId?" element={<HandReplayerPage />} />
          <Route
            path="/utilities/pot-odds"
            element={<PotOddsCalculatorPage />}
          />
          <Route path="/utilities/spr" element={<SPRCalculatorPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
const meta = {
  title: "Shell/AppLayout",
  component: AppLayout,
  tags: ["autodocs"],
  render: () => <Shell />,
  parameters: {
    layout: "fullscreen",
    route: "/equity-calculator",
    shell: true,
  },
} satisfies Meta<typeof AppLayout>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Desktop: Story = {};
export const Collapsed: Story = {
  beforeEach: () => {
    useSettingsStore.setState({ sidebarCollapsed: true });
  },
};
export const Mobile: Story = {
  globals: { viewport: { value: "iphone6", isRotated: false } },
};
export const MenuOpen: Story = {
  ...Mobile,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const trigger = c.getByRole("button", { name: "Open navigation" });
    await userEvent.click(trigger);
    const dialog = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(dialog).toBeVisible());
  },
};
export const SettingsOpen: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Settings" }),
    );
    const dialog = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(dialog).toBeVisible());
  },
};
export const AllRoutes: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    for (const [name, heading] of [
      ["Record Hand", "Record Hand"],
      ["Hand Library", "Hand Library"],
      ["Private tables", "Private tables"],
      ["Pot Odds", "Pot Odds & Equity Required"],
      ["Stack-to-Pot Ratio", "SPR Calculator"],
      ["Equity Calculator", "Equity Calculator"],
    ]) {
      await userEvent.click(c.getByRole("link", { name }));
      await expect(
        await c.findByRole("heading", { name: heading, level: 1 }),
      ).toBeVisible();
    }
  },
};
export const QuickTools: Story = { parameters: { route: "/utilities/spr" } };
export const AuthLoading: Story = {
  beforeEach: () => {
    setAuthState({ isLoaded: false });
  },
};
export const AuthSignedOut: Story = {
  beforeEach: () => {
    setAuthState({ isSignedIn: false });
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("group", {
        name: "Clerk sign-in test boundary",
      }),
    ).toBeVisible();
  },
};
export const SettingsFocus: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const trigger = c.getByRole("button", { name: "Settings" });
    await userEvent.click(trigger);
    const dialog = await within(document.body).findByRole("dialog");
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const ReplayPage: Story = {
  parameters: {
    ...knownA11y("shell-applayout--replay-page"),
    route: "/hands/replay/storybook-hand-0",
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("button", { name: "Play" }),
    ).toBeVisible();
  },
};
export const LivePage: Story = {
  parameters: {
    ...knownA11y("shell-applayout--live-page"),
    route: "/tables/storybook-table",
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("button", { name: "Invite" }),
    ).toBeVisible();
  },
};

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("link", { name: "ShipInspector home" }));
    await userEvent.keyboard("{Control>}2{/Control}");
    await expect(
      await c.findByRole("heading", { name: "Record Hand", level: 1 }),
    ).toBeVisible();
    await userEvent.keyboard("{Control>}b{/Control}");
    await expect(
      c.getByRole("button", { name: "Expand sidebar" }),
    ).toBeVisible();
  },
};
