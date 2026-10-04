import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { PokerOptions } from "./PokerOptions";
import { useSettingsStore } from "@/stores/useSettingsStore";

const meta = { title: "Settings/PokerOptions", component: PokerOptions, tags: ["autodocs"], decorators: [(Story) => <div className="max-w-sm"><Story /></div>] } satisfies Meta<typeof PokerOptions>;
export default meta;
type Story = StoryObj<typeof meta>;
export const AllCards: Story = {};
export const SuitRank: Story = { beforeEach: () => { useSettingsStore.setState({ cardSelectionMode: "Suit - Rank Selection" }); } };
export const RankSuit: Story = { beforeEach: () => { useSettingsStore.setState({ cardSelectionMode: "Rank - Suit Selection" }); } };
export const FourColor: Story = { beforeEach: () => { useSettingsStore.setState({ fourColorDeck: true }); } };
export const WithClose: Story = { args: { onClose: fn() } };
