import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./label";
import { Input } from "./input";

const meta = {
  title: "UI/Label",
  component: Label,
  tags: ["autodocs"],
  args: { children: "Starting stack" },
  render: (args) => (
    <div className="grid max-w-sm gap-2">
      <Label {...args} htmlFor="label-input" />
      <Input id="label-input" type="number" defaultValue={1000} />
    </div>
  ),
} satisfies Meta<typeof Label>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = {
  render: () => (
    <div className="grid max-w-sm gap-2" data-disabled>
      <Label htmlFor="disabled-input">Starting stack</Label>
      <Input id="disabled-input" type="number" disabled defaultValue={1000} />
    </div>
  ),
};
export const LongLabel: Story = {
  args: { children: "Starting stack for each player at this private table" },
};
