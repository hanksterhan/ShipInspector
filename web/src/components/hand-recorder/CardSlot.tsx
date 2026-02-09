import type { Card } from "@common/interfaces";
import { getRankLabel } from "@/lib/poker";
import { useSuitData } from "@/hooks/useSuitData";
import { cn } from "@/lib/utils";
import { X } from "@/assets/icons";

type CardSlotSize = "sm" | "md";

interface CardSlotProps {
  card: Card | null;
  onSelect: () => void;
  onClear: () => void;
  isActive?: boolean;
  disabled?: boolean;
  size?: CardSlotSize;
  ariaLabel?: string;
}

const sizeClasses: Record<CardSlotSize, string> = {
  sm: "min-w-[2.25rem] min-h-[2.75rem]",
  md: "min-w-[2.5rem] min-h-[3rem]",
};

export function CardSlot({
  card,
  onSelect,
  onClear,
  isActive = false,
  disabled = false,
  size = "md",
  ariaLabel,
}: CardSlotProps) {
  const resolveSuit = useSuitData();

  if (card) {
    const suitData = resolveSuit(card.suit);
    const Icon = suitData.Icon;
    return (
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          "group relative flex flex-col items-center justify-center rounded-md border p-1.5 transition-all",
          sizeClasses[size],
          isActive
            ? "border-primary ring-2 ring-primary/50"
            : "border-border hover:border-muted-foreground",
          suitData.isDark && "card-suit-dark",
          disabled && "opacity-50 pointer-events-none",
        )}
        style={{ color: suitData.color }}
      >
        <span className="text-xs font-bold leading-none">
          {getRankLabel(card.rank)}
        </span>
        <Icon className="size-3.5" />
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClear();
          }}
          className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100"
          aria-label="Clear card"
        >
          <X className="size-2.5" />
        </button>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "flex items-center justify-center rounded-md border border-dashed p-1.5 transition-all",
        sizeClasses[size],
        isActive
          ? "border-primary ring-2 ring-primary/50 bg-primary/10"
          : "border-border/50 hover:border-muted-foreground text-muted-foreground/70",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      <span className="text-xs">?</span>
    </button>
  );
}
