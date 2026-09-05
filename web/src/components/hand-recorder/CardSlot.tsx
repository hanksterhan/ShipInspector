import type { Card } from "@common/interfaces";
import { PlayingCard } from "@/components/poker/PlayingCard";

interface CardSlotProps {
  card: Card | null;
  onSelect: () => void;
  onClear: () => void;
  isActive?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
  ariaLabel?: string;
}

export function CardSlot({
  card,
  onSelect,
  onClear,
  isActive,
  disabled,
  size = "sm",
  ariaLabel = "Card",
}: CardSlotProps) {
  return (
    <PlayingCard
      card={card}
      label={ariaLabel}
      onSelect={onSelect}
      onClear={onClear}
      selected={isActive}
      disabled={disabled}
      small={size === "sm"}
    />
  );
}
