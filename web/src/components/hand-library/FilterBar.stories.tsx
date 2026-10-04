import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { FilterBar } from "./FilterBar";
import { handList } from "@/storybook/fixtures";
import { useHandLibraryFiltersStore } from "@/stores/useHandLibraryFiltersStore";

const meta = {
  title: "Library/FilterBar",
  component: FilterBar,
  tags: ["autodocs"],
  args: { hands: handList() },
} satisfies Meta<typeof FilterBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Selected: Story = {
  beforeEach: () => {
    useHandLibraryFiltersStore.setState({ stakes: "5/10", tableSize: 6 });
  },
};
export const ClearFilters: Story = {
  beforeEach: () => {
    useHandLibraryFiltersStore.setState({
      stakes: "5/10",
      tableSize: 6,
      heroCards: "AKs",
      dateStart: "2026-09-01",
      dateEnd: "2026-09-05",
    });
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button", { name: "Clear filters" }));
    await expect(c.getByLabelText("Hero Cards")).toHaveValue("");
    await expect(
      c.queryByRole("button", { name: "Clear filters" }),
    ).not.toBeInTheDocument();
  },
};

export const Combined: Story = {
  beforeEach: () => {
    useHandLibraryFiltersStore.setState({
      stakes: "5/10",
      tableSize: 6,
      heroCards: "AKs",
      dateStart: "2026-09-01",
      dateEnd: "2026-09-05",
    });
  },
};
