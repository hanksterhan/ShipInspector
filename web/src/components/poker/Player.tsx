import { Crown, X } from "lucide-react";
import { useEquityCalculatorStore } from "@/stores";
import { PlayingCard } from "./PlayingCard";
import { cn } from "@/lib/utils";

export function Player({ playerIndex }: { playerIndex: number }) {
  const {
    players,
    activePlayers,
    scope,
    pickerOpen,
    setScope,
    openPicker,
    clearCard,
    removePlayer,
    equity,
    isPlayerWinner,
  } = useEquityCalculatorStore();
  const winner = isPlayerWinner(playerIndex);
  const share = equity.playerEquity.has(playerIndex)
    ? ((equity.playerEquity.get(playerIndex) ?? 0) +
        (equity.playerTieEquity.get(playerIndex) ?? 0)) *
      100
    : null;
  return (
    <section
      className={cn("poker-seat", winner && "seat-winner")}
      aria-label={`Player ${playerIndex + 1}`}
    >
      <div className="seat-heading">
        <span className="seat-number">
          {String(playerIndex + 1).padStart(2, "0")}
        </span>
        <span>Player {playerIndex + 1}</span>
        {winner ? (
          <Crown size={14} className="winner-crown" />
        ) : (
          <button
            className="seat-remove"
            onClick={() => removePlayer(playerIndex)}
            disabled={activePlayers.size <= 2}
            aria-label={`Remove Player ${playerIndex + 1}`}
          >
            <X size={13} />
          </button>
        )}
      </div>
      <div className="seat-cards">
        {([0, 1] as const).map((cardIndex) => (
          <PlayingCard
            key={cardIndex}
            card={players[playerIndex][cardIndex]}
            label={`Player ${playerIndex + 1} card ${cardIndex + 1}`}
            small
            selected={
              pickerOpen &&
              scope.kind === "player" &&
              scope.playerIndex === playerIndex &&
              scope.cardIndex === cardIndex
            }
            winning={winner}
            onSelect={() => {
              setScope({ kind: "player", playerIndex, cardIndex });
              openPicker();
            }}
            onClear={() =>
              clearCard({ kind: "player", playerIndex, cardIndex })
            }
          />
        ))}
      </div>
      <div className="seat-equity">
        {share === null ? (
          <span>Choose cards</span>
        ) : (
          <>
            <strong>
              {share.toFixed(1)}
              <small>%</small>
            </strong>
            <span>
              {winner
                ? (equity.playerTieEquity.get(playerIndex) ?? 0) > 0
                  ? "Split pot"
                  : "Winner"
                : "equity"}
            </span>
          </>
        )}
      </div>
    </section>
  );
}
