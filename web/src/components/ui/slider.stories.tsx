import { knownA11y } from "@/storybook/knownA11y";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "./slider";

const meta = {
  title: "UI/Slider",
  component: Slider,
  tags: ["autodocs"],
  args: { defaultValue: [50], "aria-label": "Bet amount" },
  decorators: [
    (Story) => (
      <div className="h-52 max-w-md p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Slider>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { parameters: knownA11y("ui-slider--default") };
export const Range: Story = { args: { defaultValue: [25, 75] } };
export const Vertical: Story = {
  parameters: knownA11y("ui-slider--vertical"),
  args: { orientation: "vertical" },
};
export const Minimum: Story = {
  parameters: knownA11y("ui-slider--minimum"),
  args: { defaultValue: [0] },
};
export const Maximum: Story = {
  parameters: knownA11y("ui-slider--maximum"),
  args: { defaultValue: [100] },
};
export const Disabled: Story = {
  parameters: knownA11y("ui-slider--disabled"),
  args: { disabled: true },
};
