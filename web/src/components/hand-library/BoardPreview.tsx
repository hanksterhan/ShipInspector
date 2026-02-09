import { useMemo } from 'react';
import type { CardRank, CardSuit } from '@common/interfaces';
import { getRankLabel } from '@/lib/poker';
import { useSuitData } from '@/hooks/useSuitData';
import { cn } from '@/lib/utils';

interface BoardCardPreviewProps {
  card: string;
}

export function BoardCardPreview({ card }: BoardCardPreviewProps) {
  const resolveSuit = useSuitData();
  const suit = card.slice(-1) as CardSuit;
  const rankToken = card.slice(0, -1);
  const rankValue = Number(rankToken);
  const rankLabel = Number.isNaN(rankValue)
    ? rankToken
    : getRankLabel(rankValue as CardRank);
  const suitData = resolveSuit(suit);

  if (!suitData) {
    return (
      <span className="rounded border border-border/70 px-1.5 py-0.5 text-xs">
        {card}
      </span>
    );
  }

  const Icon = suitData.Icon;

  return (
    <span
      className={cn(
        'flex items-center gap-1 rounded border border-border/70 px-1.5 py-0.5 text-xs font-semibold',
      )}
      style={{ color: suitData.color }}
    >
      <span>{rankLabel}</span>
      <Icon className="size-3" />
    </span>
  );
}

export function BoardPreview({ cards }: { cards: Array<string | null> }) {
  const visibleCards = useMemo(
    () => cards.filter((card): card is string => Boolean(card)),
    [cards],
  );

  if (visibleCards.length === 0) {
    return <span className="text-xs text-muted-foreground">No board</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {visibleCards.map((card, index) => (
        <BoardCardPreview key={`${card}-${index}`} card={card} />
      ))}
    </div>
  );
}
