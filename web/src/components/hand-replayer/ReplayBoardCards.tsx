import type { Card, HandForPlayback } from "@common/interfaces";
import { useMemo } from "react";
import { parseCard } from "@common/interfaces";
import { useHandReplayStore } from "@/stores/useHandReplayStore";
import { selectCurrentPot } from "@/stores/useHandReplayStore";
import { PlayingCard } from "@/components/poker/PlayingCard";

function BoardCardSlot({ card }: { card: Card }) {
  return <PlayingCard card={card} label="Board card" />;
}

function computeBoard(
  hand: HandForPlayback,
  currentActionIndex: number,
): Card[] {
  const board: Card[] = [];
  const { hand: handRecord, actions } = hand;
  const actionsToApply = actions.slice(0, currentActionIndex + 1);
  let flopDealt = false,
    turnDealt = false,
    riverDealt = false;
  for (const a of actionsToApply) {
    if (a.action_type === "DEAL_FLOP") flopDealt = true;
    if (a.action_type === "DEAL_TURN") turnDealt = true;
    if (a.action_type === "DEAL_RIVER") riverDealt = true;
  }
  if (
    flopDealt &&
    handRecord.board_flop_1 &&
    handRecord.board_flop_2 &&
    handRecord.board_flop_3
  ) {
    board.push(
      parseCard(handRecord.board_flop_1),
      parseCard(handRecord.board_flop_2),
      parseCard(handRecord.board_flop_3),
    );
  }
  if (turnDealt && handRecord.board_turn)
    board.push(parseCard(handRecord.board_turn));
  if (riverDealt && handRecord.board_river)
    board.push(parseCard(handRecord.board_river));
  return board;
}

export function ReplayBoardCards() {
  const hand = useHandReplayStore((s) => s.hand);
  const currentActionIndex = useHandReplayStore((s) => s.currentActionIndex);
  const board = useMemo(
    () => (hand ? computeBoard(hand, currentActionIndex) : []),
    [hand, currentActionIndex],
  );
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
                  <PlayingCard key={i} card={null} label="Flop card" />
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
              <PlayingCard card={null} label="Board card" />
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
              <PlayingCard card={null} label="Board card" />
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
