import type { Card, CardSuit } from "@common/interfaces";
import { useEquityCalculatorStore } from "@/stores";
import type { SuitData } from "@/lib/poker";
import { getRankLabel } from "@/lib/poker";
import { useSuitData } from "@/hooks/useSuitData";
import { cn } from "@/lib/utils";

function BoardCardSlot({
  card,
  isActive,
  isWinning,
  onClick,
  resolveSuit,
}: {
  card: Card | null;
  isActive: boolean;
  isWinning: boolean;
  onClick: () => void;
  resolveSuit: (suit: CardSuit) => SuitData;
}) {
  if (card) {
    const suitData = resolveSuit(card.suit);
    const Icon = suitData.Icon;
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex flex-col items-center justify-center rounded-md border p-1.5",
          "min-w-[3.75rem] min-h-[5rem] md:min-w-[4.25rem] md:min-h-[5.5rem] xl:min-w-[5.5rem] xl:min-h-[7rem] transition-all",
          "motion-safe:hover:-translate-y-1",
          isWinning && "motion-safe:animate-pulse",
          isWinning
            ? "border-amber-400 ring-2 ring-amber-400/50 bg-amber-400/10"
            : isActive
              ? "border-primary ring-2 ring-primary/50"
              : "border-border hover:border-muted-foreground",
        )}
        style={{ color: suitData.color }}
      >
        <span className="text-base font-black leading-none md:text-lg xl:text-xl">
          {getRankLabel(card.rank)}
        </span>
        <Icon className="size-4 md:size-5 xl:size-6" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-md border border-dashed p-1.5",
        "min-w-[3.75rem] min-h-[5rem] md:min-w-[4.25rem] md:min-h-[5.5rem] xl:min-w-[5.5rem] xl:min-h-[7rem] transition-all",
        isActive
          ? "border-primary ring-2 ring-primary/50 bg-primary/10"
          : "border-border/50 hover:border-muted-foreground text-muted-foreground/50",
      )}
    >
      <span className="text-sm md:text-base xl:text-lg">?</span>
    </button>
  );
}

export function BoardCards() {
  const board = useEquityCalculatorStore((s) => s.board);
  const scope = useEquityCalculatorStore((s) => s.scope);
  const setScope = useEquityCalculatorStore((s) => s.setScope);
  const openPicker = useEquityCalculatorStore((s) => s.openPicker);
  const clearCard = useEquityCalculatorStore((s) => s.clearCard);
  const boardCardsUsedInWinningHand = useEquityCalculatorStore(
    (s) => s.boardCardsUsedInWinningHand,
  );
  const winningHandName = useEquityCalculatorStore((s) =>
    s.getWinningHandName(),
  );
  const resolveSuit = useSuitData();

  const handleSlotClick = (index: number) => {
    const card = board[index];
    if (card) {
      clearCard({ kind: "board", boardIndex: index });
    } else {
      setScope({ kind: "board", boardIndex: index });
      openPicker();
    }
  };

  const isScopeActive = (index: number) =>
    scope.kind === "board" && scope.boardIndex === index;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-end gap-3">
        {/* Flop */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
            Flop
          </span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <BoardCardSlot
                key={i}
                card={board[i]}
                isActive={isScopeActive(i)}
                isWinning={boardCardsUsedInWinningHand.has(i)}
                onClick={() => handleSlotClick(i)}
                resolveSuit={resolveSuit}
              />
            ))}
          </div>
        </div>

        {/* Turn */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
            Turn
          </span>
          <BoardCardSlot
            card={board[3]}
            isActive={isScopeActive(3)}
            isWinning={boardCardsUsedInWinningHand.has(3)}
            onClick={() => handleSlotClick(3)}
            resolveSuit={resolveSuit}
          />
        </div>

        {/* River */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
            River
          </span>
          <BoardCardSlot
            card={board[4]}
            isActive={isScopeActive(4)}
            isWinning={boardCardsUsedInWinningHand.has(4)}
            onClick={() => handleSlotClick(4)}
            resolveSuit={resolveSuit}
          />
        </div>
      </div>

      {/* Winning hand name */}
      {winningHandName && (
        <span className="text-xs font-medium text-amber-400">
          {winningHandName}
        </span>
      )}
    </div>
  );
}
