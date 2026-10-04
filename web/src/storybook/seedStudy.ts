import type { Card } from "@common/interfaces";
import { useEquityCalculatorStore } from "@/stores/useEquityCalculatorStore";
import { board, deck } from "./fixtures";

export function seedStudy({
  seats = [0, 1],
  filled = false,
  boardCount = 0,
  result = false,
  split = false,
}: {
  seats?: number[];
  filled?: boolean;
  boardCount?: number;
  result?: boolean;
  split?: boolean;
} = {}) {
  const pool = deck().filter(
    (c) => !board().some((b) => c.rank === b.rank && c.suit === b.suit),
  );
  const players: Array<[Card | null, Card | null]> = Array.from(
    { length: 8 },
    (_, i) =>
      filled && seats.includes(i)
        ? [pool[i * 2], pool[i * 2 + 1]]
        : [null, null],
  );
  useEquityCalculatorStore.setState({
    activePlayers: new Set(seats),
    players,
    board: Array.from({ length: 5 }, (_, i) =>
      i < boardCount ? board()[i] : null,
    ) as ReturnType<typeof useEquityCalculatorStore.getState>["board"],
  });
  // Changing cards starts the app's debounce. Cancel it before seeding a result.
  useEquityCalculatorStore.getState().dispose();
  if (result)
    useEquityCalculatorStore.setState({
      equity: {
        status: "success",
        error: null,
        data: {
          win: seats.map((_, i) => (split ? 0 : i === 0 ? 1 : 0)),
          tie: seats.map(() => (split ? 1 / seats.length : 0)),
          samples: boardCount === 5 ? 1 : 10000,
        },
        playerEquity: new Map(
          seats.map((seat, i) => [seat, split ? 0 : i === 0 ? 1 : 0]),
        ),
        playerTieEquity: new Map(
          seats.map((seat) => [seat, split ? 1 / seats.length : 0]),
        ),
      },
      boardCardsUsedInWinningHand: new Set(boardCount === 5 ? [0, 1, 2] : []),
    });
}
