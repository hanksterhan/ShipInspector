import { useMemo } from "react";
import { useHandRecorderStore } from "@/stores";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CardSlot } from "./CardSlot";

export type CardPickerTarget =
  | { kind: "board"; index: number }
  | { kind: "player"; seatIndex: number; cardIndex: 0 | 1 }
  | null;

interface BoardCardsSectionProps {
  activeTarget: CardPickerTarget;
  onPickCard: (target: { kind: "board"; index: number }) => void;
  onClearCard: (index: number) => void;
}

export function BoardCardsSection({
  activeTarget,
  onPickCard,
  onClearCard,
}: BoardCardsSectionProps) {
  const board = useHandRecorderStore((s) => s.gameSettings.board);

  const isActive = useMemo(
    () => (index: number) =>
      activeTarget?.kind === "board" && activeTarget.index === index,
    [activeTarget],
  );

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Board Cards</CardTitle>
        <CardDescription>
          Pick community cards by street. Clear to reuse a card.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="flex items-end gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Flop
            </span>
            <div className="flex gap-2">
              {[0, 1, 2].map((index) => (
                <CardSlot
                  key={index}
                  card={board[index]}
                  onSelect={() => onPickCard({ kind: "board", index })}
                  onClear={() => onClearCard(index)}
                  isActive={isActive(index)}
                  ariaLabel={`Select flop card ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Turn
            </span>
            <CardSlot
              card={board[3]}
              onSelect={() => onPickCard({ kind: "board", index: 3 })}
              onClear={() => onClearCard(3)}
              isActive={isActive(3)}
              ariaLabel="Select turn card"
            />
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              River
            </span>
            <CardSlot
              card={board[4]}
              onSelect={() => onPickCard({ kind: "board", index: 4 })}
              onClear={() => onClearCard(4)}
              isActive={isActive(4)}
              ariaLabel="Select river card"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
