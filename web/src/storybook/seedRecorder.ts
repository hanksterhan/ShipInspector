import { useHandRecorderStore } from "@/stores/useHandRecorderStore";
import { board, card } from "./fixtures";

export function seedRecorder({
  size = 6,
  filled = true,
  boardCount = 0,
}: { size?: number; filled?: boolean; boardCount?: number } = {}) {
  const state = useHandRecorderStore.getState();
  useHandRecorderStore.setState({
    gameSettings: {
      ...state.gameSettings,
      tableSize: size,
      buttonSeat: 0,
      smallBlind: 5,
      bigBlind: 10,
      ante: 0,
      board: Array.from({ length: 5 }, (_, i) =>
        i < boardCount ? board()[i] : null,
      ) as typeof state.gameSettings.board,
    },
    players: Array.from({ length: size }, (_, seatIndex) => ({
      seatIndex,
      displayName: filled
        ? [
            "Alex",
            "Marina",
            "Vega",
            "Rico",
            "Sam",
            "Robin",
            "Jordan",
            "Lee",
            "Casey",
          ][seatIndex]
        : "",
      stackAtStart: filled ? 1000 : 0,
      isHero: filled && seatIndex === 0,
      isActive: filled,
      showdownCards:
        seatIndex === 0 && filled
          ? [card(14, "s"), card(13, "s")]
          : [null, null],
    })),
  });
}
