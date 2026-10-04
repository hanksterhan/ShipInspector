import type { Meta, StoryObj } from "@storybook/react-vite";
import { BoardPreview } from "./BoardPreview";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { deck } from "@/storybook/fixtures";

const meta = {
  title: "Library/BoardPreview",
  component: BoardPreview,
  tags: ["autodocs"],
  args: { cards: [] },
} satisfies Meta<typeof BoardPreview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Flop: Story = { args: { cards: ["2h", "7d", "11c"] } };
export const Turn: Story = { args: { cards: ["2h", "7d", "11c", "9s"] } };
export const River: Story = {
  args: { cards: ["2h", "7d", "11c", "9s", "3c"] },
};
export const FourColor: Story = {
  ...River,
  beforeEach: () => {
    useSettingsStore.setState({ fourColorDeck: true });
  },
};
export const RanksAndSuits: Story = {
  args: { cards: deck().map((card) => `${card.rank}${card.suit}`) },
};
export const UnknownCard: Story = { args: { cards: ["unknown"] } };
