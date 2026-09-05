import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

export function TurnTimer({
  remaining,
  duration,
  name,
  isYou = false,
  compact = false,
}: {
  remaining: number;
  duration: number;
  name: string;
  isYou?: boolean;
  compact?: boolean;
}) {
  const warning = remaining <= 10;
  const critical = remaining <= 5;
  return (
    <div
      className={cn(
        "turn-timer",
        compact && "turn-timer-compact",
        warning && "is-warning",
        critical && "is-critical",
      )}
      role="timer"
      aria-live="off"
      aria-label={`${isYou ? "Your turn" : `${name}'s turn`}: ${remaining} seconds left`}
    >
      <span className="turn-timer-label">
        <Timer size={compact ? 13 : 18} aria-hidden="true" />
        {compact ? "To act" : isYou ? "Your turn" : `${name} to act`}
        {!compact && warning && (
          <span className="turn-timer-warning">
            {remaining === 0
              ? "Time expired"
              : critical && isYou
                ? "Act now"
                : "Time running out"}
          </span>
        )}
      </span>
      <strong className="turn-timer-number">
        {remaining}
        <small>s</small>
      </strong>
      <span className="turn-timer-track" aria-hidden="true">
        <span
          style={{
            transform: `scaleX(${Math.min(1, remaining / Math.max(1, duration))})`,
          }}
        />
      </span>
    </div>
  );
}
