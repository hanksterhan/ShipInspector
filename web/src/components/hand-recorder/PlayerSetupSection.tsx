import { useMemo } from "react";
import { useHandRecorderStore } from "@/stores";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CardSlot } from "./CardSlot";
import type { CardPickerTarget } from "./BoardCardsSection";
import { getPositionLabel } from "@/lib/poker/positions";

interface PlayerSetupSectionProps {
  activeTarget: CardPickerTarget;
  onPickCard: (target: {
    kind: "player";
    seatIndex: number;
    cardIndex: 0 | 1;
  }) => void;
  onClearCard: (seatIndex: number, cardIndex: 0 | 1) => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export function PlayerSetupSection({
  activeTarget,
  onPickCard,
  onClearCard,
}: PlayerSetupSectionProps) {
  const players = useHandRecorderStore((s) => s.players);
  const gameSettings = useHandRecorderStore((s) => s.gameSettings);
  const setPlayerActive = useHandRecorderStore((s) => s.setPlayerActive);
  const updatePlayer = useHandRecorderStore((s) => s.updatePlayer);
  const setHero = useHandRecorderStore((s) => s.setHero);
  const validationErrors = useHandRecorderStore((s) => s.validationErrors);
  const clearValidationErrors = useHandRecorderStore(
    (s) => s.clearValidationErrors,
  );

  const { errorsBySeat, generalErrors } = useMemo(() => {
    const messages = validationErrors.players || [];
    const seatErrors = players.reduce<Record<number, string[]>>(
      (acc, player) => {
        acc[player.seatIndex] = messages.filter((msg) =>
          msg.includes(`seat ${player.seatIndex + 1}`),
        );
        return acc;
      },
      {},
    );
    const general = messages.filter((msg) => !msg.includes("seat "));
    return { errorsBySeat: seatErrors, generalErrors: general };
  }, [players, validationErrors.players]);

  const isCardActive = (seatIndex: number, cardIndex: 0 | 1) =>
    activeTarget?.kind === "player" &&
    activeTarget.seatIndex === seatIndex &&
    activeTarget.cardIndex === cardIndex;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Player Setup</CardTitle>
        <CardDescription>
          Activate seats, set stacks, and choose a hero.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {players.map((player) => {
          const seatLabel = `Seat ${player.seatIndex + 1}`;
          const seatErrors = errorsBySeat[player.seatIndex];
          const positionLabel =
            player.isActive
              ? getPositionLabel(
                  player.seatIndex,
                  gameSettings.buttonSeat,
                  gameSettings.tableSize,
                )
              : null;
          return (
            <div
              key={player.seatIndex}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-sm font-semibold">{seatLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {player.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  {positionLabel && (
                    <Badge variant="secondary">{positionLabel}</Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={player.isActive ? "outline" : "default"}
                  onClick={() =>
                    setPlayerActive(player.seatIndex, !player.isActive)
                  }
                >
                  {player.isActive ? "Remove" : "Add"}
                </Button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`player-name-${player.seatIndex}`}>Name</Label>
                  <Input
                    id={`player-name-${player.seatIndex}`}
                    value={player.displayName}
                    disabled={!player.isActive}
                    onChange={(event) => {
                      clearValidationErrors();
                      updatePlayer(player.seatIndex, {
                        displayName: event.target.value,
                      });
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`player-stack-${player.seatIndex}`}>
                    Stack
                  </Label>
                  <Input
                    id={`player-stack-${player.seatIndex}`}
                    type="number"
                    min={0}
                    step={1}
                    value={player.stackAtStart}
                    disabled={!player.isActive}
                    onChange={(event) => {
                      clearValidationErrors();
                      updatePlayer(player.seatIndex, {
                        stackAtStart: Number(event.target.value),
                      });
                    }}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardSlot
                    card={player.showdownCards[0]}
                    onSelect={() =>
                      onPickCard({
                        kind: "player",
                        seatIndex: player.seatIndex,
                        cardIndex: 0,
                      })
                    }
                    onClear={() => onClearCard(player.seatIndex, 0)}
                    isActive={isCardActive(player.seatIndex, 0)}
                    disabled={!player.isActive}
                    size="sm"
                    ariaLabel={`Select first hole card for ${seatLabel}`}
                  />
                  <CardSlot
                    card={player.showdownCards[1]}
                    onSelect={() =>
                      onPickCard({
                        kind: "player",
                        seatIndex: player.seatIndex,
                        cardIndex: 1,
                      })
                    }
                    onClear={() => onClearCard(player.seatIndex, 1)}
                    isActive={isCardActive(player.seatIndex, 1)}
                    disabled={!player.isActive}
                    size="sm"
                    ariaLabel={`Select second hole card for ${seatLabel}`}
                  />
                </div>

                <Button
                  size="sm"
                  variant={player.isHero ? "default" : "outline"}
                  disabled={!player.isActive}
                  onClick={() => setHero(player.seatIndex)}
                >
                  {player.isHero ? "Hero" : "Make Hero"}
                </Button>
              </div>

              {seatErrors?.length ? (
                <div className="mt-2 space-y-1">
                  {seatErrors.map((msg) => (
                    <FieldError key={msg} message={msg} />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        {generalErrors.length ? (
          <div className="md:col-span-2">
            {generalErrors.map((msg) => (
              <FieldError key={msg} message={msg} />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
