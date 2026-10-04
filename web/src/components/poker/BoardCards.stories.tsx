import type { Meta, StoryObj } from "@storybook/react-vite";
import { BoardCards } from "./BoardCards";
import { seedStudy } from "@/storybook/seedStudy";
import { useEquityCalculatorStore } from "@/stores/useEquityCalculatorStore";

const meta = { title: "Poker/BoardCards", component: BoardCards, tags: ["autodocs"] } satisfies Meta<typeof BoardCards>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const PartialFlop: Story = { beforeEach: () => { seedStudy({ boardCount: 1 }); } };
export const Flop: Story = { beforeEach: () => { seedStudy({ boardCount: 3 }); } };
export const Turn: Story = { beforeEach: () => { seedStudy({ boardCount: 4 }); } };
export const River: Story = { beforeEach: () => { seedStudy({ boardCount: 5, result: true }); } };
export const Selected: Story = { beforeEach: () => { seedStudy({ boardCount: 3 }); useEquityCalculatorStore.setState({ pickerOpen: true, scope: { kind: "board", boardIndex: 3 } }); } };
