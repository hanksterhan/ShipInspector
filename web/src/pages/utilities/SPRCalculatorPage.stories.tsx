import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import SPRCalculatorPage from "./SPRCalculatorPage";

const meta = {
  title: "Pages/SPR",
  component: SPRCalculatorPage,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SPRCalculatorPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Result: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.type(c.getByLabelText("Effective stack (chips)"), "300");
    await userEvent.type(c.getByLabelText("Current pot (chips)"), "50");
    await expect(c.getByLabelText("Stack-to-pot result")).toHaveTextContent(
      "6.0",
    );
  },
};
export const Invalid: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.type(c.getByLabelText("Effective stack (chips)"), "-100");
    await userEvent.type(c.getByLabelText("Current pot (chips)"), "20");
    await expect(c.getByRole("alert")).toBeVisible();
  },
};
export const Presets: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Try 100 into 20" }));
    await expect(c.getByLabelText("Stack-to-pot result")).toHaveTextContent(
      "5.0",
    );
    await userEvent.click(c.getByRole("button", { name: "Reset" }));
    await expect(c.getByLabelText("Effective stack (chips)")).toHaveValue(null);
  },
};
