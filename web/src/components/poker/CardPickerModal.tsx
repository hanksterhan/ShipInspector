import { useCallback } from "react";
import type { Card, CardRank } from "@common/interfaces";
import { useSettingsStore, type CardSelectionMode } from "@/stores";
import type { SuitData } from "@/lib/poker";
import { SUITS, RANKS, getSuitData } from "@/lib/poker";
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
  disabled,
  onClick,
  suitData,
}: {
  rank: CardRank;
  disabled: boolean;
  onClick: () => void;
  suitData: SuitData;
}) {
  const rankData = RANKS.find((r) => r.rank === rank);
  const Icon = suitData.Icon;

  const label = `${rankData?.label ?? rank} of ${suitData.label}`;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
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
  fourColorDeck,
}: {
  isCardUsed: (card: Card) => boolean;
  onSelect: (card: Card) => void;
  fourColorDeck: boolean;
}) {
  return (
    <div className="grid grid-cols-13 gap-1">
      {SUITS.map((baseSuit) =>
        RANKS.map((rankData) => {
          const card: Card = { rank: rankData.rank, suit: baseSuit.suit };
          return (
            <CardButton
              key={`${rankData.rank}${baseSuit.suit}`}
              rank={rankData.rank}

              disabled={isCardUsed(card)}
              onClick={() => onSelect(card)}
              suitData={getSuitData(baseSuit.suit, fourColorDeck)}
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
  fourColorDeck,
}: {
  isCardUsed: (card: Card) => boolean;
  onSelect: (card: Card) => void;
  fourColorDeck: boolean;
}) {
  return (
    <div className="space-y-3">
      {SUITS.map((baseSuit) => {
        const resolved = getSuitData(baseSuit.suit, fourColorDeck);
        return (
          <div key={baseSuit.suit}>
            <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
              <resolved.Icon
                className={cn(
                  "size-3",
                  resolved.isDark && "card-suit-dark",
                )}
                style={{ color: resolved.color }}
              />
              <span>{resolved.label}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {RANKS.map((rankData) => {
                const card: Card = {
                  rank: rankData.rank,
                  suit: baseSuit.suit,
                };
                return (
                  <CardButton
                    key={`${rankData.rank}${baseSuit.suit}`}
                    rank={rankData.rank}
      
                    disabled={isCardUsed(card)}
                    onClick={() => onSelect(card)}
                    suitData={resolved}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RankSuitGrid({
  isCardUsed,
  onSelect,
  fourColorDeck,
}: {
  isCardUsed: (card: Card) => boolean;
  onSelect: (card: Card) => void;
  fourColorDeck: boolean;
}) {
  return (
    <div className="space-y-3">
      {[...RANKS].reverse().map((rankData) => (
        <div key={rankData.rank}>
          <div className="mb-1 text-xs font-bold text-muted-foreground">
            {rankData.label}
          </div>
          <div className="flex gap-1">
            {SUITS.map((baseSuit) => {
              const card: Card = {
                rank: rankData.rank,
                suit: baseSuit.suit,
              };
              return (
                <CardButton
                  key={`${rankData.rank}${baseSuit.suit}`}
                  rank={rankData.rank}
    
                  disabled={isCardUsed(card)}
                  onClick={() => onSelect(card)}
                  suitData={getSuitData(baseSuit.suit, fourColorDeck)}
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
  fourColorDeck,
}: {
  mode: CardSelectionMode;
  isCardUsed: (card: Card) => boolean;
  onSelect: (card: Card) => void;
  fourColorDeck: boolean;
}) {
  switch (mode) {
    case "Suit - Rank Selection":
      return (
        <SuitRankGrid
          isCardUsed={isCardUsed}
          onSelect={onSelect}
          fourColorDeck={fourColorDeck}
        />
      );
    case "Rank - Suit Selection":
      return (
        <RankSuitGrid
          isCardUsed={isCardUsed}
          onSelect={onSelect}
          fourColorDeck={fourColorDeck}
        />
      );
    case "52 Cards":
    default:
      return (
        <Grid52Cards
          isCardUsed={isCardUsed}
          onSelect={onSelect}
          fourColorDeck={fourColorDeck}
        />
      );
  }
}

export function CardPickerModal({
  isOpen,
  onClose,
  onSelectCard,
  isCardUsed,
}: CardPickerModalProps) {
  const cardSelectionMode = useSettingsStore((s) => s.cardSelectionMode);
  const fourColorDeck = useSettingsStore((s) => s.fourColorDeck);

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
          fourColorDeck={fourColorDeck}
        />
      </DialogContent>
    </Dialog>
  );
}
