import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

function Example({ value = "table", disabled = false, long = false }) {
  return (
    <Tabs defaultValue={value}>
      <TabsList aria-label="Table views">
        <TabsTrigger value="table">
          {long ? "Current table and all players" : "Table"}
        </TabsTrigger>
        <TabsTrigger value="history" disabled={disabled}>
          {long ? "All recorded actions for this hand" : "History"}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="table">Pot: 60 chips</TabsContent>
      <TabsContent value="history">Alex calls 10 chips.</TabsContent>
    </Tabs>
  );
}
const meta = {
  title: "UI/Tabs",
  component: Example,
  tags: ["autodocs"],
} satisfies Meta<typeof Example>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("tab", { name: "History" }));
    await expect(c.getByRole("tabpanel")).toHaveTextContent("Alex calls");
  },
};
export const SecondTab: Story = { args: { value: "history" } };
export const Disabled: Story = { args: { disabled: true } };
export const LongLabels: Story = { args: { long: true } };
