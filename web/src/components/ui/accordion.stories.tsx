import type { Meta, StoryObj } from "@storybook/react-vite";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./accordion";

function Example({ multiple = false, open = false, disabled = false }) {
  const items = ["Preflop", "Flop", "Turn"].map((street, i) => <AccordionItem key={street} value={street} disabled={disabled && i === 1}><AccordionTrigger>{street}</AccordionTrigger><AccordionContent>Alex calls 10 chips.</AccordionContent></AccordionItem>);
  return <div className="max-w-md">{multiple ? <Accordion type="multiple" defaultValue={["Preflop", "Flop"]}>{items}</Accordion> : <Accordion type="single" collapsible defaultValue={open ? "Preflop" : undefined}>{items}</Accordion>}</div>;
}
const meta = { title: "UI/Accordion", component: Example, tags: ["autodocs"] } satisfies Meta<typeof Example>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Single: Story = {};
export const Multiple: Story = { args: { multiple: true } };
export const Open: Story = { args: { open: true } };
export const Disabled: Story = { args: { disabled: true } };
