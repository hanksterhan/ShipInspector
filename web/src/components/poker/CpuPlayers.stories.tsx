import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { CpuPlayers } from "./CpuPlayers";
import { table, tableSeats } from "@/storybook/fixtures";
import { BOT_STYLES, BOT_PROFILES } from "@common/pokerBots";

const styles = () => BOT_STYLES.map((style, i) => ({ ...tableSeats()[i + 1], seat: i + 1, kind: "cpu" as const, botStyle: style, name: BOT_PROFILES[style].name }));
const meta = { title: "Poker/CpuPlayers", component: CpuPlayers, tags: ["autodocs"], args: { table: table({ street: "waiting", seats: [] }), disabled: false, busy: false, send: fn(), retry: fn() }, decorators: [(Story) => <div className="max-w-lg"><Story /></div>] } satisfies Meta<typeof CpuPlayers>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Styles: Story = { args: { table: table({ street: "waiting", seats: styles() }) } };
export const Full: Story = { args: { table: table({ street: "waiting", seats: tableSeats() }) } };
export const Busy: Story = { args: { busy: true, disabled: true } };
export const InPlay: Story = { args: { table: table({ seats: styles() }) } };
export const Closed: Story = { args: { table: table({ street: "waiting", closed: true }) } };
export const Error: Story = { args: { error: "CPU command failed. Retry the same action." } };
