import { Bot, Crown, UserRound } from "lucide-react";
import type { TableView } from "@common/interfaces/tableInterfaces";
import { PlayingCard } from "./PlayingCard";
import { cn } from "@/lib/utils";

export function LiveTable({ table }: { table: TableView }) {
  const paid = new Map<number, number>();
  table.awards.forEach((p) =>
    p.winners.forEach((w) =>
      paid.set(w.seat, (paid.get(w.seat) || 0) + w.amount),
    ),
  );
  const count = table.settings.maxPlayers;
  const heroPosition =
    Math.ceil(count / 2) + Math.floor(Math.floor(count / 2) / 2);
  const start =
    table.yourSeat === null
      ? 0
      : (table.yourSeat - heroPosition + count) % count;
  const seats = Array.from({ length: count }, (_, index) =>
    table.seats.find((s) => s.seat === (start + index) % count),
  );
  const split = Math.ceil(seats.length / 2);
  const renderSeat = (s: (typeof seats)[number], index: number) =>
    s ? (
      <div
        key={`${s.seat}:${table.handNumber}`}
        className={cn(
          "live-seat",
          s.isYou && "is-you",
          s.seat === table.actor && "is-acting",
          s.status === "folded" && "is-folded",
          paid.has(s.seat) && "is-winner",
        )}
        data-seat={s.seat}
      >
        <div className="live-seat-heading">
          <span className="live-avatar">
            {s.kind === "agent" ? <Bot size={16} /> : <UserRound size={16} />}
          </span>
          <strong>
            {s.name}
            {s.isYou && <small> You</small>}
          </strong>
          {table.button === s.seat && table.handNumber > 0 && (
            <span className="dealer-button" title="Dealer button">
              D
            </span>
          )}
          {paid.has(s.seat) && (
            <Crown className="live-crown" size={20} aria-label="Winner" />
          )}
        </div>
        <div className="live-hole-cards">
          {s.cards.length ? (
            s.cards.map((card, i) => (
              <PlayingCard
                key={`${card.rank}${card.suit}`}
                card={card}
                label={`${s.name} card ${i + 1}`}
                small
                winning={paid.has(s.seat)}
              />
            ))
          ) : s.hasCards ? (
            [0, 1].map((i) => (
              <div
                key={i}
                className="live-card-back"
                role="img"
                aria-label={`${s.name} hidden card ${i + 1}`}
              >
                <span>♠</span>
              </div>
            ))
          ) : (
            <span className="seat-readiness">
              {s.stack === 0
                ? "Out of chips"
                : s.sittingOut
                  ? "Sitting out"
                  : s.ready
                    ? "Ready"
                    : "Waiting"}
            </span>
          )}
        </div>
        <div className="live-seat-stack">
          {s.stack.toLocaleString()}
          <span>chips</span>
        </div>
        <div className="live-seat-action">
          {paid.has(s.seat) ? (
            <span className="chip-award">
              +{paid.get(s.seat)?.toLocaleString()}
            </span>
          ) : (
            s.lastAction || (s.seat === table.actor ? "To act" : " ")
          )}
        </div>
      </div>
    ) : (
      <div key={`empty-${index}`} className="live-seat live-seat-empty">
        <span className="empty-seat-number">
          {((start + index) % count) + 1}
        </span>
        <span>Open seat</span>
      </div>
    );
  return (
    <div className="live-felt" aria-label="Live poker table">
      <div className="live-seat-row">
        {seats.slice(0, split).map(renderSeat)}
      </div>
      <div className="live-board-area">
        <div className="live-pot">
          <span>{table.street === "complete" ? "POT AWARDED" : "POT"}</span>
          <strong>{table.pot.toLocaleString()}</strong>
        </div>
        <div className="live-board">
          {Array.from({ length: 5 }, (_, i) =>
            table.board[i] ? (
              <PlayingCard
                key={`${table.handNumber}:${i}`}
                card={table.board[i]}
                label={`Board card ${i + 1}`}
              />
            ) : (
              <div
                key={`${table.handNumber}:${i}`}
                className="live-board-empty"
                aria-label={`Board card ${i + 1}: not dealt`}
              >
                ♠
              </div>
            ),
          )}
        </div>
        <span className="felt-game-label">NO-LIMIT TEXAS HOLD’EM</span>
      </div>
      <div className="live-seat-row">
        {seats.slice(split).map((s, i) => renderSeat(s, i + split))}
      </div>
    </div>
  );
}
