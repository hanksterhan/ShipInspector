import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Input } from "./input";
import { Label } from "./label";

const meta = { title: "UI/Input", component: Input, tags: ["autodocs"], args: { id: "story-input", placeholder: "Player name" }, render: (args) => <div className="grid max-w-sm gap-2"><Label htmlFor={args.id}>Player name</Label><Input {...args} /></div> } satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Filled: Story = { args: { defaultValue: "Alex Morgan" } };
export const Disabled: Story = { args: { disabled: true, defaultValue: "Alex" } };
export const ReadOnly: Story = { args: { readOnly: true, defaultValue: "Alex" } };
export const Invalid: Story = { args: { "aria-invalid": true, defaultValue: "" } };
export const Types: Story = { render: () => <div className="grid max-w-sm gap-4">{["text", "number", "date", "file", "password"].map((type) => <div className="grid gap-2" key={type}><Label htmlFor={`type-${type}`}>{type}</Label><Input id={`type-${type}`} type={type} /></div>)}</div> };
export const Focus: Story = { play: async ({ canvasElement }) => {
  const input = within(canvasElement).getByRole("textbox");
  await userEvent.click(input); await userEvent.type(input, "Marina");
  await expect(input).toHaveValue("Marina"); await expect(input).toHaveFocus();
} };
