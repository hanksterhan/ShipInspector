import { knownA11y } from "@/storybook/knownA11y";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import { HandLibraryList } from "./HandLibraryList";
import { handList } from "@/storybook/fixtures";
import { useHandLibraryStore } from "@/stores/useHandLibraryStore";
import { useHandLibraryFiltersStore } from "@/stores/useHandLibraryFiltersStore";

const hands = handList();
const meta = {
  title: "Library/HandLibraryList",
  component: HandLibraryList,
  tags: ["autodocs"],
  args: { hands },
  beforeEach: () => {
    useHandLibraryStore.setState({ hands });
  },
} satisfies Meta<typeof HandLibraryList>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Loading: Story = {
  args: { hands: [] },
  beforeEach: () => {
    useHandLibraryStore.setState({ isLoading: true });
  },
};
export const Empty: Story = { args: { hands: [] } };
export const Populated: Story = {};
export const SortDate: Story = {
  beforeEach: () => {
    useHandLibraryFiltersStore.setState({
      sortField: "date",
      sortDirection: "asc",
    });
  },
};
export const SortStakes: Story = {
  beforeEach: () => {
    useHandLibraryFiltersStore.setState({
      sortField: "stakes",
      sortDirection: "desc",
    });
  },
};
export const SortTableSize: Story = {
  beforeEach: () => {
    useHandLibraryFiltersStore.setState({
      sortField: "tableSize",
      sortDirection: "asc",
    });
  },
};
export const Selected: Story = {
  beforeEach: () => {
    useHandLibraryStore.setState({ selectedHandId: hands[0].id });
  },
};
export const Pagination: Story = {
  beforeEach: () => {
    useHandLibraryStore.setState({ nextCursor: "next-page", isLoading: true });
  },
};
export const Error: Story = {
  args: { hands: [] },
  beforeEach: () => {
    useHandLibraryStore.setState({ error: "Could not load hands." });
  },
};
export const DeleteOpen: Story = {
  parameters: knownA11y("library-handlibrarylist--delete-open"),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getAllByRole("button", { name: "Delete hand" })[0],
    );
  },
};
