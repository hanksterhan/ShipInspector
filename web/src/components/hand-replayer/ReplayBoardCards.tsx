import type { Card, HandForPlayback } from "@common/interfaces";
import { useMemo } from "react";
import { parseCard } from "@common/interfaces";
import { useHandReplayStore } from "@/stores/useHandReplayStore";
import {
  selectCurrentPot,
} from "@/stores/useHandReplayStore";
import { getRankLabel } from "@/lib/poker";
import { useSuitData } from "@/hooks/useSuitData";
import { cn } from "@/lib/utils";

function BoardCardSlot({ card }: { card: Card }) {
  const resolveSuit = useSuitData();
  const suitData = resolveSuit(card.suit);
  const Icon = suitData.Icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded border p-1.5 min-w-[3.75rem] min-h-[5rem] md:min-w-[4.25rem] md:min-h-[5.5rem] xl:min-w-[5.5rem] xl:min-h-[7rem] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-200",
        suitData.isDark && "card-suit-dark",
      )}
      style={{ color: suitData.color, borderColor: suitData.color }}
    >
      <span className="text-base font-black leading-none md:text-lg xl:text-xl">
        {getRankLabel(card.rank)}
      </span>
      <Icon className="size-4 md:size-5 xl:size-6" />
    </div>
  );
}

function computeBoard(hand: HandForPlayback, currentActionIndex: number): Card[] {
  const board: Card[] = [];
  const { hand: handRecord, actions } = hand;
  const actionsToApply = actions.slice(0, currentActionIndex + 1);
  let flopDealt = false, turnDealt = false, riverDealt = false;
  for (const a of actionsToApply) {
    if (a.action_type === "DEAL_FLOP") flopDealt = true;
    if (a.action_type === "DEAL_TURN") turnDealt = true;
    if (a.action_type === "DEAL_RIVER") riverDealt = true;
  }
  if (flopDealt && handRecord.board_flop_1 && handRecord.board_flop_2 && handRecord.board_flop_3) {
    board.push(parseCard(handRecord.board_flop_1), parseCard(handRecord.board_flop_2), parseCard(handRecord.board_flop_3));
  }
  if (turnDealt && handRecord.board_turn) board.push(parseCard(handRecord.board_turn));
  if (riverDealt && handRecord.board_river) board.push(parseCard(handRecord.board_river));
  return board;
}

export function ReplayBoardCards() {
  const hand = useHandReplayStore((s) => s.hand);
  const currentActionIndex = useHandReplayStore((s) => s.currentActionIndex);
  const board = useMemo(() => (hand ? computeBoard(hand, currentActionIndex) : []), [hand, currentActionIndex]);
  const pot = useHandReplayStore(selectCurrentPot);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-end gap-3">
          {/* Flop */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
              Flop
            </span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) =>
                board[i] ? (
                  <BoardCardSlot key={i} card={board[i]!} />
                ) : (
                  <div
                    key={i}
                    className="flex min-w-[3.75rem] min-h-[5rem] md:min-w-[4.25rem] md:min-h-[5.5rem] xl:min-w-[5.5rem] xl:min-h-[7rem] items-center justify-center rounded border border-dashed border-border/50"
                  >
                    <span className="text-xs text-muted-foreground/50">?</span>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Turn */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
              Turn
            </span>
            {board[3] ? (
              <BoardCardSlot card={board[3]} />
            ) : (
              <div className="flex min-w-[3.75rem] min-h-[5rem] md:min-w-[4.25rem] md:min-h-[5.5rem] xl:min-w-[5.5rem] xl:min-h-[7rem] items-center justify-center rounded border border-dashed border-border/50">
                <span className="text-xs text-muted-foreground/50">?</span>
              </div>
            )}
          </div>

          {/* River */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
              River
            </span>
            {board[4] ? (
              <BoardCardSlot card={board[4]} />
            ) : (
              <div className="flex min-w-[3.75rem] min-h-[5rem] md:min-w-[4.25rem] md:min-h-[5.5rem] xl:min-w-[5.5rem] xl:min-h-[7rem] items-center justify-center rounded border border-dashed border-border/50">
                <span className="text-xs text-muted-foreground/50">?</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {pot > 0 && (
        <div className="rounded-md bg-muted/60 px-3 py-1 text-sm font-semibold tabular-nums">
          Pot: ${(pot / 100).toFixed(2)}
        </div>
      )}
    </div>
  );
}
