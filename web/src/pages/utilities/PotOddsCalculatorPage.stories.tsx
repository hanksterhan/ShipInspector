import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import PotOddsCalculatorPage from "./PotOddsCalculatorPage";

const meta = {
  title: "Pages/PotOdds",
  component: PotOddsCalculatorPage,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PotOddsCalculatorPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Result: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.type(
      c.getByLabelText("Pot including opponent’s bet (chips)"),
      "150",
    );
    await userEvent.type(c.getByLabelText("Amount to call (chips)"), "50");
    await expect(c.getByLabelText("Pot odds result")).toHaveTextContent(
      "25.0%",
    );
  },
};
export const Invalid: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.type(
      c.getByLabelText("Pot including opponent’s bet (chips)"),
      "-10",
    );
    await userEvent.type(c.getByLabelText("Amount to call (chips)"), "50");
    await expect(c.getByRole("alert")).toBeVisible();
  },
};
export const Presets: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Half-pot bet" }));
    await expect(c.getByLabelText("Pot odds result")).toHaveTextContent(
      "25.0%",
    );
    await userEvent.click(c.getByRole("button", { name: "Pot-sized bet" }));
    await expect(c.getByLabelText("Pot odds result")).toHaveTextContent(
      "33.3%",
    );
  },
};
