import type { Card, CardSuit } from "@common/interfaces";
import { useEquityCalculatorStore, type Scope } from "@/stores";
import type { SuitData } from "@/lib/poker";
import { getRankLabel } from "@/lib/poker";
import { useSuitData } from "@/hooks/useSuitData";
import { cn } from "@/lib/utils";
import { Crown, X } from "@/assets/icons";
import { Button } from "@/components/ui/button";

interface PlayerProps {
  playerIndex: number;
}

function CardSlot({
  card,
  isActive,
  onClick,
  onClear,
  resolveSuit,
}: {
  card: Card | null;
  isActive: boolean;
  onClick: () => void;
  onClear: () => void;
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
          "relative flex flex-col items-center justify-center rounded-md border p-1",
          "min-w-[3rem] min-h-[4rem] md:min-w-[3.5rem] md:min-h-[4.5rem] xl:min-w-[4.5rem] xl:min-h-[5.5rem] transition-all",
          isActive
            ? "border-primary ring-2 ring-primary/50"
            : "border-border hover:border-muted-foreground",
        )}
        style={{ color: suitData.color }}
      >
        <span className="text-sm font-black leading-none md:text-base xl:text-lg">
          {getRankLabel(card.rank)}
        </span>
        <Icon className="size-3.5 md:size-4 xl:size-5" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="absolute -top-1.5 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100"
          aria-label="Clear card"
        >
          <X className="size-2" />
        </button>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-md border border-dashed p-1",
        "min-w-[3rem] min-h-[4rem] md:min-w-[3.5rem] md:min-h-[4.5rem] xl:min-w-[4.5rem] xl:min-h-[5.5rem] transition-all",
        isActive
          ? "border-primary ring-2 ring-primary/50 bg-primary/10"
          : "border-border hover:border-muted-foreground text-muted-foreground",
      )}
    >
      <span className="text-xs md:text-sm xl:text-base">?</span>
    </button>
  );
}

export function Player({ playerIndex }: PlayerProps) {
  const cards = useEquityCalculatorStore((s) => s.getPlayerCards(playerIndex));
  const scope = useEquityCalculatorStore((s) => s.scope);
  const setScope = useEquityCalculatorStore((s) => s.setScope);
  const openPicker = useEquityCalculatorStore((s) => s.openPicker);
  const clearCard = useEquityCalculatorStore((s) => s.clearCard);
  const removePlayer = useEquityCalculatorStore((s) => s.removePlayer);
  const equity = useEquityCalculatorStore((s) => s.getPlayerEquity(playerIndex));
  const tieEquity = useEquityCalculatorStore((s) =>
    s.getPlayerTieEquity(playerIndex),
  );
  const isWinner = useEquityCalculatorStore((s) =>
    s.isPlayerWinner(playerIndex),
  );
  const winningHandName = useEquityCalculatorStore((s) =>
    s.getWinningHandName(),
  );
  const resolveSuit = useSuitData();

  const isScopeActive = (cardIndex: 0 | 1) =>
    scope.kind === "player" &&
    scope.playerIndex === playerIndex &&
    scope.cardIndex === cardIndex;

  const handleSlotClick = (cardIndex: 0 | 1) => {
    const newScope: Scope = { kind: "player", playerIndex, cardIndex };
    setScope(newScope);
    openPicker();
  };

  const handleClearCard = (cardIndex: 0 | 1) => {
    clearCard({ kind: "player", playerIndex, cardIndex });
  };

  return (
    <div
      className={cn(
        "group flex flex-col items-center gap-1 rounded-lg border bg-card p-2 transition-all",
        isWinner
          ? "border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]"
          : "border-border",
      )}
    >
      {/* Header row: player label + remove button */}
      <div className="flex w-full items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground">
          P{playerIndex + 1}
        </span>
        {isWinner && <Crown className="size-3 text-amber-400" />}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => removePlayer(playerIndex)}
          className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          aria-label={`Remove Player ${playerIndex + 1}`}
        >
          <X className="size-2.5" />
        </Button>
      </div>

      {/* Card slots */}
      <div className="flex gap-1">
        <CardSlot
          card={cards[0]}
          isActive={isScopeActive(0)}
          onClick={() => handleSlotClick(0)}
          onClear={() => handleClearCard(0)}
          resolveSuit={resolveSuit}
        />
        <CardSlot
          card={cards[1]}
          isActive={isScopeActive(1)}
          onClick={() => handleSlotClick(1)}
          onClear={() => handleClearCard(1)}
          resolveSuit={resolveSuit}
        />
      </div>

      {/* Equity display */}
      {equity !== null && (
        <div className="w-full space-y-0.5">
          <div className="flex items-center justify-between text-[10px] tabular-nums">
            <span
              className={cn(
                "font-bold",
                isWinner ? "text-green-400" : "text-foreground",
              )}
            >
              {equity.toFixed(1)}%
            </span>
            {tieEquity !== null && tieEquity > 0.05 && (
              <span className="text-muted-foreground">
                T: {tieEquity.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isWinner ? "bg-green-500" : "bg-primary",
              )}
              style={{ width: `${Math.min(equity, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Winning hand name */}
      {isWinner && winningHandName && (
        <span className="text-[9px] font-medium text-green-400">
          {winningHandName}
        </span>
      )}
    </div>
  );
}
