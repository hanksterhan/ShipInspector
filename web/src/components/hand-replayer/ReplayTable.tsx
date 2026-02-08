import type { HandForPlayback } from "@common/interfaces";
import { ReplayPlayer } from "./ReplayPlayer";
import { ReplayBoardCards } from "./ReplayBoardCards";

// Player positions arranged around the table (ellipse).
// Same convention as PokerTable: 0 = bottom-center (hero).
// Supports up to 10 positions for full-ring.
const PLAYER_POSITIONS: Array<{ left: string; top: string }> = [
  { left: "50%", top: "88%" }, // 0: bottom-center
  { left: "15%", top: "75%" }, // 1
  { left: "3%", top: "45%" }, // 2
  { left: "8%", top: "28%" }, // 3
  { left: "15%", top: "15%" }, // 4
  { left: "50%", top: "2%" }, // 5: top-center
  { left: "85%", top: "15%" }, // 6
  { left: "92%", top: "28%" }, // 7
  { left: "97%", top: "45%" }, // 8
  { left: "85%", top: "75%" }, // 9
];

interface ReplayTableProps {
  hand: HandForPlayback;
}

export function ReplayTable({ hand }: ReplayTableProps) {
  return (
    <div className="relative mx-auto aspect-[16/10] w-full max-w-4xl">
      {/* Table background */}
      <div className="absolute inset-[8%] rounded-[50%] border-2 border-border bg-card shadow-inner" />
      <div className="absolute inset-[10%] rounded-[50%] border border-border/50 bg-muted/30" />

      {/* Board cards - centered */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <ReplayBoardCards />
      </div>

      {/* Player positions */}
      {hand.players.map((player) => {
        const posIndex = Math.min(
          player.seat_index,
          PLAYER_POSITIONS.length - 1,
        );
        const pos = PLAYER_POSITIONS[posIndex];

        return (
          <div
            key={player.seat_index}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: pos.left, top: pos.top }}
          >
            <ReplayPlayer seatIndex={player.seat_index} />
          </div>
        );
      })}
    </div>
  );
}
