import { useCallback } from "react";
import type { CardSuit } from "@common/interfaces";
import type { SuitData } from "@/lib/poker";
import { getSuitData } from "@/lib/poker";
import { useSettingsStore } from "@/stores";

/** Returns a function that resolves suit data respecting the 4-color deck setting. */
export function useSuitData(): (suit: CardSuit) => SuitData {
  const fourColorDeck = useSettingsStore((s) => s.fourColorDeck);
  return useCallback(
    (suit: CardSuit) => getSuitData(suit, fourColorDeck),
    [fourColorDeck],
  );
}
