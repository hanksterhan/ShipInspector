import { knownA11y } from "@/storybook/knownA11y";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "./table";

function Example({
  empty = false,
  selected = false,
  footer = false,
  overflow = false,
}) {
  return (
    <div className={overflow ? "max-w-sm" : "max-w-2xl"}>
      <Table>
        <TableCaption>Player stacks</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead>Seat</TableHead>
            <TableHead>Stack</TableHead>
            {overflow && <TableHead>Last action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {empty ? (
            <TableRow>
              <TableCell colSpan={3}>No players</TableCell>
            </TableRow>
          ) : (
            ["Alex", "Marina", "Sam"].map((name, i) => (
              <TableRow
                key={name}
                data-state={selected && i === 0 ? "selected" : undefined}
              >
                <TableCell>
                  {overflow ? `${name} with a very long player name` : name}
                </TableCell>
                <TableCell>{i + 1}</TableCell>
                <TableCell>1,000</TableCell>
                {overflow && <TableCell>Raises to 100 chips</TableCell>}
              </TableRow>
            ))
          )}
        </TableBody>
        {footer && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>Total</TableCell>
              <TableCell>3,000</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
const meta = {
  title: "UI/Table",
  component: Example,
  tags: ["autodocs"],
} satisfies Meta<typeof Example>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Populated: Story = {};
export const Empty: Story = { args: { empty: true } };
export const Selected: Story = { args: { selected: true } };
export const Footer: Story = { args: { footer: true } };
export const Overflow: Story = {
  parameters: knownA11y("ui-table--overflow"),
  args: { overflow: true },
};
