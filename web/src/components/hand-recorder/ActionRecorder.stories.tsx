import { knownA11y } from "@/storybook/knownA11y";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { VALID_ACTION_TAGS, type ActionType } from "@common/interfaces";
import { ActionRecorder } from "./ActionRecorder";
import { seedRecorder } from "@/storybook/seedRecorder";
import {
  useHandRecorderStore,
  type HandRecorderAction,
} from "@/stores/useHandRecorderStore";

const types: ActionType[] = [
  "POST_SB",
  "POST_BB",
  "POST_ANTE",
  "STRADDLE",
  "FOLD",
  "CHECK",
  "CALL",
  "BET",
  "RAISE",
  "ALL_IN",
  "REVEAL",
  "DEAL_FLOP",
  "DEAL_TURN",
  "DEAL_RIVER",
  "COLLECT",
  "NOTE",
];
const action = (type: ActionType = "CALL"): HandRecorderAction => ({
  street: "preflop",
  actionType: type,
  actorSeat: type.startsWith("DEAL_") ? null : 0,
  amount:
    ["FOLD", "CHECK", "REVEAL", "NOTE"].includes(type) ||
    type.startsWith("DEAL_")
      ? null
      : 10,
  raiseTo: type === "RAISE" ? 30 : null,
  decisionMs: 800,
  tags: [],
});
const meta = {
  title: "Recorder/ActionRecorder",
  component: ActionRecorder,
  tags: ["autodocs"],
  beforeEach: () => {
    seedRecorder();
  },
} satisfies Meta<typeof ActionRecorder>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  parameters: knownA11y("recorder-actionrecorder--default"),
};
export const ActionTypes: Story = {
  parameters: knownA11y("recorder-actionrecorder--action-types"),
  beforeEach: () => {
    seedRecorder();
    useHandRecorderStore.setState({
      actions: types.map((type) => action(type)),
    });
  },
};
export const Amount: Story = {
  parameters: knownA11y("recorder-actionrecorder--amount"),
  beforeEach: () => {
    seedRecorder();
    useHandRecorderStore.setState({ actions: [action("BET")] });
  },
};
export const Raise: Story = {
  parameters: knownA11y("recorder-actionrecorder--raise"),
  beforeEach: () => {
    seedRecorder();
    useHandRecorderStore.setState({ actions: [action("RAISE")] });
  },
};
export const Tags: Story = {
  parameters: knownA11y("recorder-actionrecorder--tags"),
  beforeEach: () => {
    seedRecorder();
    useHandRecorderStore.setState({
      actions: [{ ...action(), tags: [...VALID_ACTION_TAGS] }],
    });
  },
};
export const LongHistory: Story = {
  parameters: knownA11y("recorder-actionrecorder--long-history"),
  beforeEach: () => {
    seedRecorder();
    useHandRecorderStore.setState({
      actions: Array.from({ length: 30 }, (_, i) => ({
        ...action(types[i % types.length]),
        street: i < 8 ? "preflop" : i < 16 ? "flop" : i < 23 ? "turn" : "river",
      })),
    });
  },
};
export const Edit: Story = {
  parameters: knownA11y("recorder-actionrecorder--edit"),
  beforeEach: () => {
    seedRecorder();
    useHandRecorderStore.setState({ actions: [action()] });
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const amounts = c.getAllByRole("spinbutton");
    const amount = amounts[amounts.length - 1];
    await userEvent.clear(amount);
    await userEvent.type(amount, "25");
    await expect(amount).toHaveValue(25);
  },
};
export const Delete: Story = {
  parameters: knownA11y("recorder-actionrecorder--delete"),
  beforeEach: () => {
    seedRecorder();
    useHandRecorderStore.setState({ actions: [action(), action("CHECK")] });
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getAllByRole("button", { name: /^Delete$/ })[0]);
    await expect(c.getAllByRole("button", { name: /^Delete$/ })).toHaveLength(
      1,
    );
  },
};
