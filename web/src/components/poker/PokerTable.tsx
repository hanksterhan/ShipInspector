import { useEquityCalculatorStore } from "@/stores";
import { Player } from "./Player";
import { BoardCards } from "./BoardCards";
import { Ship } from "lucide-react";

export function PokerTable() {
  const activePlayers = useEquityCalculatorStore((s) => s.activePlayers);
  const seats = [...activePlayers].sort((a, b) => a - b);
  const middle = Math.ceil(seats.length / 2);
  return (
    <div className="poker-stage" data-player-count={seats.length}>
      <div className="table-felt" aria-hidden="true">
        <div className="felt-stitch" />
      </div>
      <div className="seat-row seat-row-top">
        {seats.slice(middle).map((index) => (
          <Player key={index} playerIndex={index} />
        ))}
      </div>
      <div className="table-center">
        <div className="table-wordmark" aria-hidden="true">
          <Ship size={20} strokeWidth={1.3} />
          <span>SHIP INSPECTOR</span>
        </div>
        <BoardCards />
        <span className="table-game">TEXAS HOLD’EM</span>
      </div>
      <div className="seat-row seat-row-bottom">
        {seats.slice(0, middle).map((index) => (
          <Player key={index} playerIndex={index} />
        ))}
      </div>
    </div>
  );
}
