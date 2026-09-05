import type { Card } from "@common/interfaces";
import { Plus, X } from "lucide-react";
import { useSuitData } from "@/hooks/useSuitData";
import { getRankLabel } from "@/lib/poker";
import { cn } from "@/lib/utils";

export interface PlayingCardProps {
  card: Card | null;
  label: string;
  selected?: boolean;
  winning?: boolean;
  disabled?: boolean;
  small?: boolean;
  onSelect?: () => void;
  onClear?: () => void;
}

// Shared by study, hand entry, and replay. The caller owns interaction and game state.
export function PlayingCard({
  card,
  label,
  selected,
  winning,
  disabled,
  small,
  onSelect,
  onClear,
}: PlayingCardProps) {
  const resolveSuit = useSuitData();
  const suit = card ? resolveSuit(card.suit) : null;
  const cardName =
    card && suit ? `${getRankLabel(card.rank)} of ${suit.label}` : "Empty";
  const contents =
    card && suit ? (
      <>
        <span className="card-corner">
          <b>{getRankLabel(card.rank)}</b>
          <suit.Icon />
        </span>
        <suit.Icon className="card-suit" />
        <span className="card-bottom" aria-hidden="true">
          {getRankLabel(card.rank)}
        </span>
      </>
    ) : (
      <Plus size={18} strokeWidth={1.4} />
    );
  const classes = cn(
    "playing-card",
    card ? "card-face" : "card-empty",
    selected && "card-selected",
    winning && "card-winning",
    small && "card-small",
  );
  const color = card
    ? suit?.suit === "h"
      ? "#bb354a"
      : suit?.suit === "d"
        ? suit.color === "#60a5fa"
          ? "#205daf"
          : "#bb354a"
        : suit?.suit === "c" && suit.color === "#22c55e"
          ? "#19704a"
          : "#182a26"
    : undefined;
  return (
    <div className="card-wrap">
      {onSelect ? (
        <button
          type="button"
          className={classes}
          disabled={disabled}
          onClick={onSelect}
          aria-label={`${label}: ${cardName}`}
          aria-pressed={selected}
          style={{ color }}
        >
          {contents}
        </button>
      ) : (
        <div
          className={classes}
          role="img"
          aria-label={`${label}: ${cardName}`}
          style={{ color }}
        >
          {contents}
        </div>
      )}
      {card && onClear && (
        <button
          type="button"
          disabled={disabled}
          className="card-clear"
          onClick={onClear}
          aria-label={`Clear ${label}`}
          title={`Clear ${label}`}
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}
