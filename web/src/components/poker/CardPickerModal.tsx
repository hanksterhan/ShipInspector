import { useCallback, useRef } from "react";
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
  title?: string;
  keepOpen?: boolean;
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
        "flex flex-col items-center justify-center rounded-md border border-border p-1.5 md:p-2 transition-colors",
        "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        "deck-card",
        disabled && "opacity-25 pointer-events-none",
      )}
      style={{ color: suitData.color }}
    >
      <span className="text-sm font-bold leading-none md:text-base xl:text-lg">
        {rankData?.label}
      </span>
      <Icon className="size-4 md:size-5 xl:size-6" />
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
    <div className="deck-suits">
      {SUITS.map((baseSuit) => (
        <div className="deck-suit-group" key={baseSuit.suit}>
          <div className="deck-suit-name">{baseSuit.label}</div>
          <div className="deck-grid">
            {[...RANKS].reverse().map((rankData) => {
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
            })}
          </div>
        </div>
      ))}
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
            <div className="mb-1 flex items-center gap-1 text-sm text-muted-foreground md:text-base">
              <resolved.Icon
                className="size-4 md:size-5"
                style={{ color: resolved.color }}
              />
              <span>{resolved.label}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
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
          <div className="flex gap-1.5 md:gap-2">
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
  title = "Select a Card",
  keepOpen = false,
  isOpen,
  onClose,
  onSelectCard,
  isCardUsed,
}: CardPickerModalProps) {
  const previousFocus = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardSelectionMode = useSettingsStore((s) => s.cardSelectionMode);
  const fourColorDeck = useSettingsStore((s) => s.fourColorDeck);

  const handleSelect = useCallback(
    (card: Card) => {
      if (onSelectCard(card) && !keepOpen) onClose();
    },
    [onSelectCard, onClose, keepOpen],
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          previousFocus.current = document.activeElement as HTMLElement;
          titleRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (previousFocus.current?.isConnected) previousFocus.current.focus();
          else document.getElementById("main-content")?.focus();
        }}
        className="card-picker max-w-[95vw] sm:max-w-[760px] xl:max-w-[850px]"
      >
        <DialogHeader>
          <DialogTitle
            ref={titleRef}
            tabIndex={-1}
            className="outline-none"
            aria-live="polite"
          >
            {title}
          </DialogTitle>
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
