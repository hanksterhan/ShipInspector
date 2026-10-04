import { knownA11y } from "@/storybook/knownA11y";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator } from "./select";

function Example({ value = "", disabled = false, invalid = false, size = "default" as "default" | "sm", grouped = false, scroll = false, popper = false, open = false }) {
  return <Select defaultValue={value || undefined} disabled={disabled} defaultOpen={open}><SelectTrigger size={size} aria-label="CPU style" aria-invalid={invalid}><SelectValue placeholder="Choose a style" /></SelectTrigger><SelectContent position={popper ? "popper" : "item-aligned"} className={scroll ? "max-h-48" : undefined}>
    <SelectGroup>{grouped && <SelectLabel>Styles</SelectLabel>}{["Passive", "Balanced", "Aggressive"].map(name => <SelectItem key={name} value={name} disabled={grouped && name === "Aggressive"}>{name}</SelectItem>)}</SelectGroup>
    {grouped && <><SelectSeparator /><SelectGroup><SelectLabel>Practice</SelectLabel><SelectItem value="Random">Random</SelectItem></SelectGroup></>}
    {scroll && Array.from({ length: 30 }, (_, i) => <SelectItem key={i} value={`style-${i}`}>Style {i + 1}</SelectItem>)}
  </SelectContent></Select>;
}
const meta = { title: "UI/Select", component: Example, tags: ["autodocs"] } satisfies Meta<typeof Example>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Selected: Story = { args: { value: "Balanced" } };
export const Disabled: Story = { args: { disabled: true } };
export const Invalid: Story = { args: { invalid: true } };
export const Sizes: Story = { render: () => <div className="flex gap-4"><Example size="sm" /><Example /></div> };
const openSelect: Story["play"] = async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole("combobox")); await userEvent.keyboard("{ArrowDown}"); await waitFor(() => expect(within(document.body).getByRole("option", { name: "Balanced" })).toHaveFocus()); };
export const Grouped: Story = { parameters: knownA11y("ui-select--grouped"), args: { grouped: true }, play: openSelect };
export const Scrollable: Story = { parameters: knownA11y("ui-select--scrollable"), args: { scroll: true }, play: openSelect };
export const Popper: Story = { parameters: knownA11y("ui-select--popper"), args: { popper: true }, play: openSelect };
