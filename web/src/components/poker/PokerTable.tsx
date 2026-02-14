import { useEquityCalculatorStore } from "@/stores";
import { Player } from "./Player";
import { AddPlayerButton } from "./AddPlayerButton";
import { BoardCards } from "./BoardCards";

// 8 player positions arranged in an elliptical layout around the table.
// Coordinates are percentages (left%, top%) relative to the table container.
// Positions go clockwise from bottom-center (hero position).
const PLAYER_POSITIONS: Array<{ left: string; top: string }> = [
  { left: "50%", top: "88%" }, // 0: bottom-center (hero)
  { left: "15%", top: "75%" }, // 1: bottom-left
  { left: "3%", top: "45%" }, // 2: left
  { left: "15%", top: "18%" }, // 3: top-left
  { left: "50%", top: "8%" }, // 4: top-center
  { left: "85%", top: "18%" }, // 5: top-right
  { left: "97%", top: "45%" }, // 6: right
  { left: "85%", top: "75%" }, // 7: bottom-right
];

export function PokerTable() {
  const isPlayerActive = useEquityCalculatorStore((s) => s.isPlayerActive);

  return (
    <div className="relative aspect-[16/10] h-full max-w-full">
      {/* Table background */}
      <div className="absolute inset-[8%] rounded-[50%] border-2 border-amber-900/30 bg-emerald-950/20 shadow-inner" />
      <div className="absolute inset-[10%] rounded-[50%] border border-amber-900/30 bg-emerald-950/20" />

      {/* Board cards - centered */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <BoardCards />
      </div>

      {/* Player positions */}
      {PLAYER_POSITIONS.map((pos, index) => (
        <div
          key={index}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: pos.left, top: pos.top }}
        >
          {isPlayerActive(index) ? (
            <Player playerIndex={index} />
          ) : (
            <AddPlayerButton playerIndex={index} />
          )}
        </div>
      ))}
    </div>
  );
}
