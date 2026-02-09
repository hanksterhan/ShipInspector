import { useSettingsStore, type CardSelectionMode } from "@/stores";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "@/assets/icons";
import { cn } from "@/lib/utils";

const CARD_SELECTION_MODES: CardSelectionMode[] = [
  "52 Cards",
  "Suit - Rank Selection",
  "Rank - Suit Selection",
];

interface PokerOptionsProps {
  onClose?: () => void;
}

export function PokerOptions({ onClose }: PokerOptionsProps) {
  const cardSelectionMode = useSettingsStore((s) => s.cardSelectionMode);
  const setCardSelectionMode = useSettingsStore((s) => s.setCardSelectionMode);
  const fourColorDeck = useSettingsStore((s) => s.fourColorDeck);
  const setFourColorDeck = useSettingsStore((s) => s.setFourColorDeck);

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Settings</h3>
        {onClose && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* Card Selection Mode */}
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground">
          Card selection mode
        </Label>
        <div className="flex flex-col gap-2">
          {CARD_SELECTION_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setCardSelectionMode(mode)}
              className={cn(
                "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                cardSelectionMode === mode
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted/50",
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Display Options */}
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground">
          Display
        </Label>
        <button
          type="button"
          onClick={() => setFourColorDeck(!fourColorDeck)}
          className={cn(
            "flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors",
            fourColorDeck
              ? "border-primary bg-primary/10"
              : "border-border hover:bg-muted/50",
          )}
          role="switch"
          aria-checked={fourColorDeck}
          aria-label="4-color deck"
        >
          <span>4-color deck</span>
          <span
            className={cn(
              "flex h-5 w-9 items-center rounded-full px-0.5 transition-colors",
              fourColorDeck ? "bg-primary" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "size-4 rounded-full bg-background shadow transition-transform",
                fourColorDeck && "translate-x-4",
              )}
            />
          </span>
        </button>
      </div>
    </div>
  );
}
