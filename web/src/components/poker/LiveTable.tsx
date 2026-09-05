import { BrainCircuit, CircleDot, Crown, UserRound } from "lucide-react";
import type { TableView } from "@common/interfaces/tableInterfaces";
import { BOT_PROFILES } from "@common/pokerBots";
import { BotIcon } from "./CpuPlayers";
import { PlayingCard } from "./PlayingCard";
import { cn } from "@/lib/utils";
import { useCardDeal } from "@/hooks/useCardDeal";

export function LiveTable({ table }: { table: TableView }) {
  const felt = useCardDeal(table);
  const betting = !["waiting", "complete"].includes(table.street);
  const street =
    table.street === "preflop"
      ? "Preflop"
      : table.street[0].toUpperCase() + table.street.slice(1);
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
          s.kind === "cpu" && `cpu-${s.botStyle || "balanced"}`,
          s.seat === table.actor && "is-acting",
          s.status === "folded" && table.street !== "complete" && "is-folded",
          paid.has(s.seat) && "is-winner",
        )}
        data-seat={s.seat}
      >
        <div className="live-seat-heading">
          <span className="live-avatar">
            {s.kind === "cpu" ? (
              <BotIcon style={s.botStyle || "balanced"} size={17} />
            ) : s.kind === "agent" ? (
              <BrainCircuit size={16} />
            ) : (
              <UserRound size={16} />
            )}
          </span>
          <strong>
            {s.name}
            {s.isYou && <small> You</small>}
            {s.kind === "cpu" && (
              <small
                className="cpu-seat-tag"
                title={BOT_PROFILES[s.botStyle || "balanced"].label}
              >
                {" "}
                CPU
              </small>
            )}
          </strong>
          {paid.has(s.seat) && (
            <Crown className="live-crown" size={20} aria-label="Winner" />
          )}
        </div>
        <div className="live-seat-positions">
          {table.street !== "waiting" && s.status !== "waiting" && (
            <>
              {table.button === s.seat && (
                <span
                  className="live-position position-dealer"
                  aria-label={`${s.name}: Dealer`}
                >
                  Dealer
                </span>
              )}
              {table.smallBlindSeat === s.seat && (
                <span
                  className="live-position position-small-blind"
                  aria-label={`${s.name}: Small blind`}
                >
                  Small blind
                </span>
              )}
              {table.bigBlindSeat === s.seat && (
                <span
                  className="live-position position-big-blind"
                  aria-label={`${s.name}: Big blind`}
                >
                  Big blind
                </span>
              )}
            </>
          )}
        </div>
        <div className="live-hole-cards">
          {s.hasCards ? (
            [0, 1].map((i) => (
              <div
                key={i}
                className="live-dealt-card"
                data-seat={s.seat}
                data-card={i}
              >
                {s.cards[i] ? (
                  <PlayingCard
                    card={s.cards[i]}
                    label={`${s.name} card ${i + 1}`}
                    small
                    winning={paid.has(s.seat)}
                  />
                ) : (
                  <div
                    className="live-card-back"
                    role="img"
                    aria-label={`${s.name} hidden card ${i + 1}`}
                  >
                    <span>♠</span>
                  </div>
                )}
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
        {betting && s.status !== "waiting" && (
          <div
            className={cn("live-seat-bet", s.bet > 0 && "has-bet")}
            role="group"
            aria-label={`${s.name}: ${street} bet ${s.bet.toLocaleString()} chips`}
          >
            <span>{street} bet</span>
            <strong>
              <CircleDot size={16} aria-hidden="true" />
              {s.bet.toLocaleString()}
            </strong>
          </div>
        )}
        <div className="live-seat-stack">
          <span>Stack</span> {s.stack.toLocaleString()}
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
    <div ref={felt} className="live-felt" aria-label="Live poker table">
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
