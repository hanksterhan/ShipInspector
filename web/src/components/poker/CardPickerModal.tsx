import { useCallback } from "react";
import type { Card, CardRank, CardSuit } from "@common/interfaces";
import { useSettingsStore, type CardSelectionMode } from "@/stores";
import { SUITS, RANKS, SUIT_MAP } from "@/lib/poker";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CardPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCard: (card: Card) => boolean;
  isCardUsed: (card: Card) => boolean;
}

function CardButton({
  rank,
  suit,
  disabled,
  onClick,
}: {
  rank: CardRank;
  suit: CardSuit;
  disabled: boolean;
  onClick: () => void;
}) {
  const suitData = SUIT_MAP[suit];
  const rankData = RANKS.find((r) => r.rank === rank);
  const Icon = suitData.Icon;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-border p-1 transition-colors",
        "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        "min-w-[2.25rem] min-h-[2.75rem]",
        suitData.isDark && "card-suit-dark",
        disabled && "opacity-25 pointer-events-none",
      )}
      style={{ color: suitData.color }}
    >
      <span className="text-xs font-bold leading-none">
        {rankData?.label}
      </span>
      <Icon className="size-3" />
    </button>
  );
}

function Grid52Cards({
  isCardUsed,
  onSelect,
}: {
  isCardUsed: (card: Card) => boolean;
  onSelect: (card: Card) => void;
}) {
  return (
    <div className="grid grid-cols-13 gap-1">
      {SUITS.map((suitData) =>
        RANKS.map((rankData) => {
          const card: Card = { rank: rankData.rank, suit: suitData.suit };
          return (
            <CardButton
              key={`${rankData.rank}${suitData.suit}`}
              rank={rankData.rank}
              suit={suitData.suit}
              disabled={isCardUsed(card)}
              onClick={() => onSelect(card)}
            />
          );
        }),
      )}
    </div>
  );
}

function SuitRankGrid({
  isCardUsed,
  onSelect,
}: {
  isCardUsed: (card: Card) => boolean;
  onSelect: (card: Card) => void;
}) {
  return (
    <div className="space-y-3">
      {SUITS.map((suitData) => (
        <div key={suitData.suit}>
          <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
            <suitData.Icon
              className={cn("size-3", suitData.isDark && "card-suit-dark")}
              style={{ color: suitData.color }}
            />
            <span>{suitData.label}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {RANKS.map((rankData) => {
              const card: Card = { rank: rankData.rank, suit: suitData.suit };
              return (
                <CardButton
                  key={`${rankData.rank}${suitData.suit}`}
                  rank={rankData.rank}
                  suit={suitData.suit}
                  disabled={isCardUsed(card)}
                  onClick={() => onSelect(card)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function RankSuitGrid({
  isCardUsed,
  onSelect,
}: {
  isCardUsed: (card: Card) => boolean;
  onSelect: (card: Card) => void;
}) {
  return (
    <div className="space-y-3">
      {[...RANKS].reverse().map((rankData) => (
        <div key={rankData.rank}>
          <div className="mb-1 text-xs font-bold text-muted-foreground">
            {rankData.label}
          </div>
          <div className="flex gap-1">
            {SUITS.map((suitData) => {
              const card: Card = { rank: rankData.rank, suit: suitData.suit };
              return (
                <CardButton
                  key={`${rankData.rank}${suitData.suit}`}
                  rank={rankData.rank}
                  suit={suitData.suit}
                  disabled={isCardUsed(card)}
                  onClick={() => onSelect(card)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function CardGrid({
  mode,
  isCardUsed,
  onSelect,
}: {
  mode: CardSelectionMode;
  isCardUsed: (card: Card) => boolean;
  onSelect: (card: Card) => void;
}) {
  switch (mode) {
    case "Suit - Rank Selection":
      return <SuitRankGrid isCardUsed={isCardUsed} onSelect={onSelect} />;
    case "Rank - Suit Selection":
      return <RankSuitGrid isCardUsed={isCardUsed} onSelect={onSelect} />;
    case "52 Cards":
    default:
      return <Grid52Cards isCardUsed={isCardUsed} onSelect={onSelect} />;
  }
}

export function CardPickerModal({
  isOpen,
  onClose,
  onSelectCard,
  isCardUsed,
}: CardPickerModalProps) {
  const cardSelectionMode = useSettingsStore((s) => s.cardSelectionMode);

  const handleSelect = useCallback(
    (card: Card) => {
      onSelectCard(card);
      onClose();
    },
    [onSelectCard, onClose],
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-fit">
        <DialogHeader>
          <DialogTitle>Select a Card</DialogTitle>
        </DialogHeader>
        <CardGrid
          mode={cardSelectionMode}
          isCardUsed={isCardUsed}
          onSelect={handleSelect}
        />
      </DialogContent>
    </Dialog>
  );
}
