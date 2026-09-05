import type { HandForPlayback } from "@common/interfaces";
import { ReplayPlayer } from "./ReplayPlayer";
import { ReplayBoardCards } from "./ReplayBoardCards";

export function ReplayTable({ hand }: { hand: HandForPlayback }) {
  const seats = [...hand.players].sort((a, b) => a.seat_index - b.seat_index);
  const middle = Math.ceil(seats.length / 2);
  return (
    <section
      className="table-panel replay-table"
      aria-label="Hand replay table"
    >
      <div className="table-toolbar">
        <span className="table-type">No-limit Hold’em</span>
        <span className="player-count">{seats.length} players · Replay</span>
      </div>
      <div className="poker-stage">
        <div className="table-felt" aria-hidden="true">
          <div className="felt-stitch" />
        </div>
        <div className="seat-row seat-row-top">
          {seats.slice(middle).map((p) => (
            <ReplayPlayer key={p.seat_index} seatIndex={p.seat_index} />
          ))}
        </div>
        <div className="table-center">
          <ReplayBoardCards />
        </div>
        <div className="seat-row seat-row-bottom">
          {seats.slice(0, middle).map((p) => (
            <ReplayPlayer key={p.seat_index} seatIndex={p.seat_index} />
          ))}
        </div>
      </div>
    </section>
  );
}
