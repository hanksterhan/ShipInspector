import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { EquityDisplay } from "./EquityDisplay";
import { useEquityCalculatorStore } from "@/stores/useEquityCalculatorStore";
import { seedStudy } from "@/storybook/seedStudy";

const meta = { title: "Poker/EquityDisplay", component: EquityDisplay, tags: ["autodocs"] } satisfies Meta<typeof EquityDisplay>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Idle: Story = {};
export const Loading: Story = { beforeEach: () => { useEquityCalculatorStore.setState(s => ({ equity: { ...s.equity, status: "loading" } })); } };
export const Error: Story = { beforeEach: () => { useEquityCalculatorStore.setState(s => ({ equity: { ...s.equity, status: "error", error: "Equity service unavailable" } })); } };
export const Sampled: Story = { beforeEach: () => { seedStudy({ filled: true, boardCount: 3, result: true }); }, play: async ({ canvasElement }) => { await new Promise(resolve => setTimeout(resolve, 400)); await expect(within(canvasElement).getByText("10,000 samples")).toBeVisible(); } };
export const Exact: Story = { beforeEach: () => { seedStudy({ filled: true, boardCount: 5, result: true }); } };
