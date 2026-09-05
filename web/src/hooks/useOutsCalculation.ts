import { useEffect, useRef, useState } from "react";
import type { Card, CalculateOutsResponse } from "@common/interfaces";
import { useEquityCalculatorStore } from "@/stores";
import { pokerService } from "@/services";
import { holeToString, boardToString } from "@/lib/poker";

interface OutsState {
  data: CalculateOutsResponse | null;
  loading: boolean;
  error: string | null;
}

const OUTS_DEBOUNCE_MS = 400;

export function useOutsCalculation(): OutsState {
  const [state, setState] = useState<OutsState>({
    data: null,
    loading: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = useEquityCalculatorStore.subscribe(
      (s) => ({
        players: s.players,
        activePlayers: s.activePlayers,
        board: s.board,
      }),
      (current) => {
        // Clear previous timer
        if (timerRef.current) clearTimeout(timerRef.current);
        if (abortRef.current) abortRef.current.abort();
        setState({ data: null, loading: false, error: null });

        // Check conditions: exactly 2 active players with complete hands, 4 board cards
        const boardCards = current.board.filter((c): c is Card => c !== null);
        if (boardCards.length !== 4) {
          setState({ data: null, loading: false, error: null });
          return;
        }

        const playersWithHands: Array<{
          playerIndex: number;
          cards: [Card, Card];
        }> = [];
        for (const playerIndex of [...current.activePlayers].sort(
          (a, b) => a - b,
        )) {
          const player = current.players[playerIndex];
          if (player?.[0] && player?.[1]) {
            playersWithHands.push({
              playerIndex,
              cards: [player[0], player[1]],
            });
          }
        }

        if (playersWithHands.length !== 2 || current.activePlayers.size !== 2) {
          setState({ data: null, loading: false, error: null });
          return;
        }

        // Debounce the outs calculation
        timerRef.current = setTimeout(async () => {
          if (abortRef.current) abortRef.current.abort();
          const controller = new AbortController();
          abortRef.current = controller;

          setState((prev) => ({ ...prev, loading: true, error: null }));

          try {
            const hero = holeToString({ cards: playersWithHands[0].cards });
            const villain = holeToString({ cards: playersWithHands[1].cards });
            const board = boardToString({ cards: boardCards });

            const result = await pokerService.getOuts(
              hero,
              villain,
              board,
              controller.signal,
            );

            if (!controller.signal.aborted) {
              setState({ data: result, loading: false, error: null });
            }
          } catch (err) {
            if (err instanceof Error && err.name === "AbortError") return;
            if (!controller.signal.aborted) {
              setState({
                data: null,
                loading: false,
                error:
                  err instanceof Error
                    ? err.message
                    : "Failed to calculate outs",
              });
            }
          }
        }, OUTS_DEBOUNCE_MS);
      },
      {
        fireImmediately: true,
        equalityFn: (a, b) =>
          a.players === b.players &&
          a.board === b.board &&
          a.activePlayers === b.activePlayers,
      },
    );

    return () => {
      unsubscribe();
      if (abortRef.current) abortRef.current.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return state;
}
