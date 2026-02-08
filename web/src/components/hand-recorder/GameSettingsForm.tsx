import { useMemo } from "react";
import { useHandRecorderStore } from "@/stores";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export function GameSettingsForm() {
  const gameSettings = useHandRecorderStore((s) => s.gameSettings);
  const players = useHandRecorderStore((s) => s.players);
  const validationErrors = useHandRecorderStore((s) => s.validationErrors);
  const clearValidationErrors = useHandRecorderStore(
    (s) => s.clearValidationErrors,
  );
  const setTableSize = useHandRecorderStore((s) => s.setTableSize);
  const setButtonSeat = useHandRecorderStore((s) => s.setButtonSeat);
  const setSmallBlind = useHandRecorderStore((s) => s.setSmallBlind);
  const setBigBlind = useHandRecorderStore((s) => s.setBigBlind);
  const setAnte = useHandRecorderStore((s) => s.setAnte);

  const tableSizeOptions = useMemo(
    () => Array.from({ length: 8 }, (_, index) => index + 2),
    [],
  );
  const seatOptions = useMemo(
    () => Array.from({ length: gameSettings.tableSize }, (_, i) => i),
    [gameSettings.tableSize],
  );

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Game Settings</CardTitle>
        <CardDescription>
          Configure stakes and table setup. Seats: {players.length}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="table-size">Table Size</Label>
          <Select
            value={String(gameSettings.tableSize)}
            onValueChange={(value) => {
              clearValidationErrors();
              setTableSize(Number(value));
            }}
          >
            <SelectTrigger id="table-size" className="mt-2 w-full">
              <SelectValue placeholder="Select table size" />
            </SelectTrigger>
            <SelectContent>
              {tableSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} seats
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={validationErrors["hand.table_size"]?.[0]} />
        </div>

        <div>
          <Label htmlFor="button-seat">Dealer Button</Label>
          <Select
            value={String(gameSettings.buttonSeat)}
            onValueChange={(value) => {
              clearValidationErrors();
              setButtonSeat(Number(value));
            }}
          >
            <SelectTrigger id="button-seat" className="mt-2 w-full">
              <SelectValue placeholder="Select button seat" />
            </SelectTrigger>
            <SelectContent>
              {seatOptions.map((seatIndex) => (
                <SelectItem key={seatIndex} value={String(seatIndex)}>
                  Seat {seatIndex + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={validationErrors["hand.button_seat"]?.[0]} />
        </div>

        <div>
          <Label htmlFor="small-blind">Small Blind</Label>
          <Input
            id="small-blind"
            type="number"
            min={0}
            step={1}
            value={gameSettings.smallBlind}
            onChange={(event) => {
              clearValidationErrors();
              setSmallBlind(Number(event.target.value));
            }}
            className="mt-2"
          />
          <FieldError message={validationErrors["hand.small_blind"]?.[0]} />
        </div>

        <div>
          <Label htmlFor="big-blind">Big Blind</Label>
          <Input
            id="big-blind"
            type="number"
            min={0}
            step={1}
            value={gameSettings.bigBlind}
            onChange={(event) => {
              clearValidationErrors();
              setBigBlind(Number(event.target.value));
            }}
            className="mt-2"
          />
          <FieldError message={validationErrors["hand.big_blind"]?.[0]} />
        </div>

        <div>
          <Label htmlFor="ante">Ante</Label>
          <Input
            id="ante"
            type="number"
            min={0}
            step={1}
            value={gameSettings.ante}
            onChange={(event) => {
              clearValidationErrors();
              setAnte(Number(event.target.value));
            }}
            className="mt-2"
          />
          <FieldError message={validationErrors["hand.ante"]?.[0]} />
        </div>
      </CardContent>
    </Card>
  );
}
