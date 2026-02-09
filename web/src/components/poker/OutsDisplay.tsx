import type { Card, CardSuit, CalculateOutsResponse } from "@common/interfaces";
import type { SuitData } from "@/lib/poker";
import { getRankLabel } from "@/lib/poker";
import { useSuitData } from "@/hooks/useSuitData";
import { Loader2 } from "@/assets/icons";
import { cn } from "@/lib/utils";

interface OutsDisplayProps {
  data: CalculateOutsResponse | null;
  loading: boolean;
  error: string | null;
}

function OutCard({
  card,
  variant,
  resolveSuit,
}: {
  card: Card;
  variant: "win" | "tie";
  resolveSuit: (suit: CardSuit) => SuitData;
}) {
  const suitData = resolveSuit(card.suit);
  const Icon = suitData.Icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded border p-1",
        "min-w-[2rem] min-h-[2.5rem]",
        variant === "win"
          ? "border-green-500/50 bg-green-500/10"
          : "border-yellow-500/50 bg-yellow-500/10",
      )}
      style={{ color: suitData.color }}
    >
      <span className="text-xs font-bold leading-none">
        {getRankLabel(card.rank)}
      </span>
      <Icon className="size-3" />
    </div>
  );
}

export function OutsDisplay({ data, loading, error }: OutsDisplayProps) {
  const resolveSuit = useSuitData();

  if (loading) {
    return (
      <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        <span>Calculating outs...</span>
      </div>
    );
  }

  if (error) {
    return <div role="alert" className="text-sm text-destructive">{error}</div>;
  }

  if (!data) return null;

  if (data.suppressed) {
    return (
      <div className="space-y-1 text-sm">
        <div className="font-medium text-muted-foreground">Outs</div>
        <div className="text-xs text-muted-foreground">
          {data.suppressed.reason}
        </div>
      </div>
    );
  }

  const winOuts = data.win_outs_cards || [];
  const tieOuts = data.tie_outs_cards || [];

  return (
    <div className="space-y-3">
      {/* Baseline percentages */}
      <div className="flex gap-4 text-xs">
        <span className="text-green-400">
          Win: {(data.baseline_win * 100).toFixed(1)}%
        </span>
        <span className="text-yellow-400">
          Tie: {(data.baseline_tie * 100).toFixed(1)}%
        </span>
        <span className="text-red-400">
          Lose: {(data.baseline_lose * 100).toFixed(1)}%
        </span>
      </div>

      {/* Win outs */}
      {winOuts.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-green-400">
            Win Outs ({winOuts.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {winOuts.map((card) => (
              <OutCard
                key={`${card.rank}${card.suit}`}
                card={card}
                variant="win"
                resolveSuit={resolveSuit}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tie outs */}
      {tieOuts.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-yellow-400">
            Tie Outs ({tieOuts.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {tieOuts.map((card) => (
              <OutCard
                key={`${card.rank}${card.suit}`}
                card={card}
                variant="tie"
                resolveSuit={resolveSuit}
              />
            ))}
          </div>
        </div>
      )}

      {winOuts.length === 0 && tieOuts.length === 0 && (
        <div className="text-xs text-muted-foreground">No outs available</div>
      )}
    </div>
  );
}
