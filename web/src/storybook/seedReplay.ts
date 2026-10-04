import type { HandForPlayback } from "@common/interfaces";
import { useHandReplayStore } from "@/stores/useHandReplayStore";
import { replayHand } from "./fixtures";

export function seedReplay({
  hand = replayHand(),
  index = -1,
}: { hand?: HandForPlayback; index?: number } = {}) {
  useHandReplayStore.getState().dispose();
  useHandReplayStore.setState({
    hand,
    currentActionIndex: index,
    loadStatus: "success",
    loadError: null,
    isPlaying: false,
  });
  return hand;
}
