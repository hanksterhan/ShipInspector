import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { CardPickerModal } from "./CardPickerModal";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { Card } from "@common/interfaces";

const meta = { title: "Poker/CardPicker", component: CardPickerModal, tags: ["autodocs"], args: { isOpen: true, onClose: () => {}, onSelectCard: (() => true) as (card: Card) => boolean, isCardUsed: (() => false) as (card: Card) => boolean }, render: args => { const [open, setOpen] = useState(args.isOpen); return <CardPickerModal {...args} isOpen={open} onClose={() => setOpen(false)} />; } } satisfies Meta<typeof CardPickerModal>;
export default meta;
type Story = StoryObj<typeof meta>;
export const AllCards: Story = {};
export const SuitRank: Story = { beforeEach: () => { useSettingsStore.setState({ cardSelectionMode: "Suit - Rank Selection" }); } };
export const RankSuit: Story = { beforeEach: () => { useSettingsStore.setState({ cardSelectionMode: "Rank - Suit Selection" }); } };
export const UsedCards: Story = { args: { isCardUsed: card => card.rank >= 12 } };
export const KeepOpen: Story = { args: { keepOpen: true }, play: async () => { const body = within(document.body); await userEvent.click(body.getByRole("button", { name: "A of Spades" })); await expect(body.getByRole("dialog")).toBeVisible(); } };
export const Rejected: Story = { args: { onSelectCard: () => false }, play: KeepOpen.play };
export const CustomTitle: Story = { args: { title: "Choose the river card" } };
