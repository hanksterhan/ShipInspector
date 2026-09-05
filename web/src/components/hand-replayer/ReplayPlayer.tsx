import type { Card } from "@common/interfaces";
import { useMemo } from "react";
import { useHandReplayStore } from "@/stores/useHandReplayStore";
import {
  selectPlayerStateBySeat,
  selectVisibleCards,
  selectActivePlayers,
  selectWinnerSeats,
  selectCurrentAction,
} from "@/stores/useHandReplayStore";
import { PlayingCard } from "@/components/poker/PlayingCard";
import { cn } from "@/lib/utils";
import { Crown, CardBackIcon } from "@/assets/icons";

interface ReplayPlayerProps {
  seatIndex: number;
}

function CardDisplay({
  card,
  faceDown,
}: {
  card: Card | null;
  faceDown: boolean;
}) {
  if (faceDown || !card)
    return (
      <div
        className="playing-card card-small replay-card-back"
        aria-label="Card face down"
      >
        <CardBackIcon className="size-6" />
      </div>
    );
  return <PlayingCard card={card} label="Hole card" small />;
}

export function ReplayPlayer({ seatIndex }: ReplayPlayerProps) {
  const hand = useHandReplayStore((s) => s.hand);
  const currentActionIndex = useHandReplayStore((s) => s.currentActionIndex);

  const { state, holeCards, isFolded, isWinner, isCurrentActor } =
    useMemo(() => {
      if (!hand)
        return {
          state: null,
          holeCards: [null, null] as [Card | null, Card | null],
          isFolded: true,
          isWinner: false,
          isCurrentActor: false,
        };
      const snapshot = { hand, currentActionIndex };
      const playerStateMap = selectPlayerStateBySeat(
        snapshot as Parameters<typeof selectPlayerStateBySeat>[0],
      );
      const visible = selectVisibleCards(
        snapshot as Parameters<typeof selectVisibleCards>[0],
      );
      const active = selectActivePlayers(
        snapshot as Parameters<typeof selectActivePlayers>[0],
      );
      const winners = selectWinnerSeats(
        snapshot as Parameters<typeof selectWinnerSeats>[0],
      );
      const action = selectCurrentAction(
        snapshot as Parameters<typeof selectCurrentAction>[0],
      );
      const state = playerStateMap.get(seatIndex);
      const holeCards = visible.holeCardsBySeat.get(seatIndex) ?? [null, null];
      return {
        state,
        holeCards,
        isFolded: !active.has(seatIndex),
        isWinner: winners.has(seatIndex),
        isCurrentActor: action?.actor_seat === seatIndex,
      };
    }, [hand, currentActionIndex, seatIndex]);

  if (!hand) return null;

  const player = hand.players.find((p) => p.seat_index === seatIndex);
  if (!player) return null;

  const stack = state?.stack ?? player.stack_at_start;
  const streetBet = state?.streetBet ?? 0;
  const isAllIn = state?.isAllIn ?? false;
  const showHoleCards = holeCards[0] !== null || holeCards[1] !== null;

  return (
    <div
      className={cn(
        "poker-seat replay-seat flex flex-col items-center gap-2",
        isFolded && "opacity-60 grayscale",
        isWinner && "seat-winner",
        isCurrentActor && "ring-2 ring-primary ring-offset-2",
      )}
    >
      <div className="flex w-full items-center justify-between gap-1">
        <span
          className={cn(
            "truncate text-xs font-medium",
            isWinner ? "text-yellow-500" : "text-foreground",
          )}
          title={player.display_name}
        >
          {player.display_name}
          {hand.hand.button_seat === seatIndex && (
            <span className="dealer-button" title="Dealer button">
              D
            </span>
          )}
          {player.is_hero && (
            <span className="ml-0.5 text-[10px] text-muted-foreground">
              (hero)
            </span>
          )}
        </span>
        {isWinner && <Crown className="size-3.5 shrink-0 text-yellow-400" />}
      </div>

      <div className="flex gap-1">
        <CardDisplay card={holeCards[0]} faceDown={!showHoleCards} />
        <CardDisplay card={holeCards[1]} faceDown={!showHoleCards} />
      </div>

      <div className="flex flex-col items-center text-[10px] tabular-nums">
        <span className="font-medium">${(stack / 100).toFixed(2)}</span>
        {streetBet > 0 && (
          <span className="text-muted-foreground">
            bet: ${(streetBet / 100).toFixed(2)}
          </span>
        )}
        {isAllIn && (
          <span className="text-xs font-semibold text-orange-500">ALL IN</span>
        )}
      </div>
    </div>
  );
}
