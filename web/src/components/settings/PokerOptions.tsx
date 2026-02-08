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

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Card Selection</h3>
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
    </div>
  );
}
