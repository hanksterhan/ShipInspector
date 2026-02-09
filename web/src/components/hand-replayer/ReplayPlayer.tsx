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
import { getRankLabel } from "@/lib/poker";
import { useSuitData } from "@/hooks/useSuitData";
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
  const resolveSuit = useSuitData();

  if (faceDown || !card) {
    return (
      <div
        className="flex items-center justify-center rounded border border-border bg-muted/50 p-1 min-w-[3rem] min-h-[4rem] md:min-w-[3.5rem] md:min-h-[4.5rem] xl:min-w-[4.5rem] xl:min-h-[5.5rem]"
        aria-label="Card face down"
      >
        <CardBackIcon className="size-5 text-muted-foreground" />
      </div>
    );
  }

  const suitData = resolveSuit(card.suit);
  const Icon = suitData.Icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded border p-1 min-w-[3rem] min-h-[4rem] md:min-w-[3.5rem] md:min-h-[4.5rem] xl:min-w-[4.5rem] xl:min-h-[5.5rem]",
        suitData.isDark && "card-suit-dark",
      )}
      style={{ color: suitData.color, borderColor: suitData.color }}
    >
      <span className="text-sm font-black leading-none md:text-base xl:text-lg">
        {getRankLabel(card.rank)}
      </span>
      <Icon className="size-3.5 md:size-4 xl:size-5" />
    </div>
  );
}

export function ReplayPlayer({ seatIndex }: ReplayPlayerProps) {
  const hand = useHandReplayStore((s) => s.hand);
  const currentActionIndex = useHandReplayStore((s) => s.currentActionIndex);

  const { state, holeCards, isFolded, isWinner, isCurrentActor } = useMemo(() => {
    if (!hand) return { state: null, holeCards: [null, null] as [Card | null, Card | null], isFolded: true, isWinner: false, isCurrentActor: false };
    const snapshot = { hand, currentActionIndex };
    const playerStateMap = selectPlayerStateBySeat(snapshot as Parameters<typeof selectPlayerStateBySeat>[0]);
    const visible = selectVisibleCards(snapshot as Parameters<typeof selectVisibleCards>[0]);
    const active = selectActivePlayers(snapshot as Parameters<typeof selectActivePlayers>[0]);
    const winners = selectWinnerSeats(snapshot as Parameters<typeof selectWinnerSeats>[0]);
    const action = selectCurrentAction(snapshot as Parameters<typeof selectCurrentAction>[0]);
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
        "flex flex-col items-center gap-1 rounded-lg border bg-card p-2 transition-all min-w-[5rem]",
        isFolded && "opacity-60 grayscale",
        isWinner && "border-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.3)]",
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
          {player.is_hero && (
            <span className="ml-0.5 text-[10px] text-muted-foreground">
              (hero)
            </span>
          )}
        </span>
        {isWinner && <Crown className="size-3.5 shrink-0 text-yellow-400" />}
      </div>

      <div className="flex gap-1">
        <CardDisplay
          card={holeCards[0]}
          faceDown={!showHoleCards}
        />
        <CardDisplay
          card={holeCards[1]}
          faceDown={!showHoleCards}
        />
      </div>

      <div className="flex flex-col items-center text-[10px] tabular-nums">
        <span className="font-medium">${(stack / 100).toFixed(2)}</span>
        {streetBet > 0 && (
          <span className="text-muted-foreground">bet: ${(streetBet / 100).toFixed(2)}</span>
        )}
        {isAllIn && (
          <span className="text-xs font-semibold text-orange-500">ALL IN</span>
        )}
      </div>
    </div>
  );
}
