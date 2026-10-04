import { knownA11y } from "@/storybook/knownA11y";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Plus } from "lucide-react";
import { Button } from "./button";

const meta = { title: "UI/Button", component: Button, tags: ["autodocs"], args: { children: "Deal hand", onClick: fn() } } satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
const variants = ["default", "secondary", "destructive", "outline", "ghost", "link"] as const;
const sizes = ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"] as const;
export const Variants: Story = { parameters: knownA11y("ui-button--variants"), render: () => <div className="flex flex-wrap gap-4">{variants.map((variant) => <Button key={variant} variant={variant}>{variant}</Button>)}</div> };
export const Sizes: Story = { render: () => <div className="flex flex-wrap items-center gap-4">{sizes.map((size) => <Button key={size} size={size} aria-label={size}>{size.startsWith("icon") ? <Plus /> : size}</Button>)}</div> };
export const Disabled: Story = { args: { disabled: true } };
export const Invalid: Story = { args: { "aria-invalid": true } };
export const Icon: Story = { args: { size: "icon", "aria-label": "Add player", children: <Plus /> } };
export const AsLink: Story = { render: () => <Button asChild><a href="#main-content">Hand library</a></Button> };
export const Focus: Story = { play: async ({ canvasElement }) => {
  await userEvent.tab();
  await expect(within(canvasElement).getByRole("button", { name: "Deal hand" })).toHaveFocus();
} };
