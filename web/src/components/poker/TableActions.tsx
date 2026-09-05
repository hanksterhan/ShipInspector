import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type {
  TableCommand,
  TableView,
} from "@common/interfaces/tableInterfaces";
import { Button } from "@/components/ui/button";

export function TableActions({
  table,
  disabled,
  send,
}: {
  table: TableView;
  disabled: boolean;
  send: (command: TableCommand) => void;
}) {
  const [raising, setRaising] = useState(false);
  const legal = table.legal;
  const [amount, setAmount] = useState(legal?.minRaiseTo || 0);
  const you = table.seats.find((s) => s.isYou);
  const between = ["waiting", "complete"].includes(table.street);
  const clamp = (n: number) =>
    Math.max(
      legal?.minRaiseTo || 0,
      Math.min(legal?.maxRaiseTo || 0, Math.round(n)),
    );
  if (table.closed)
    return (
      <div className="table-action-bar">
        <strong>This table is closed</strong>
      </div>
    );
  if (between || you?.status === "waiting")
    return (
      <div className="table-action-bar between-hands">
        <div>
          <strong>
            {you
              ? you.ready
                ? "You’re ready"
                : "Ready for the next hand?"
              : "Watching the table"}
          </strong>
          <span>
            {
              table.seats.filter((s) => s.ready && !s.sittingOut && s.stack > 0)
                .length
            }{" "}
            players ready
          </span>
        </div>
        <div className="live-button-group">
          {you &&
            (you.stack === 0 ? (
              <Button
                disabled={disabled}
                onClick={() => send({ type: "rebuy" })}
              >
                Refill play chips
              </Button>
            ) : (
              <Button
                variant={you.ready ? "secondary" : "default"}
                disabled={disabled}
                onClick={() => send({ type: "ready", ready: !you.ready })}
              >
                {you.ready ? (
                  "Sit out"
                ) : (
                  <>
                    <Check size={17} />
                    I’m ready
                  </>
                )}
              </Button>
            ))}
          {table.canDeal && (
            <Button disabled={disabled} onClick={() => send({ type: "deal" })}>
              Deal hand
            </Button>
          )}
          {you && (
            <Button
              variant="ghost"
              disabled={disabled}
              onClick={() => send({ type: "leave" })}
            >
              Leave seat
            </Button>
          )}
        </div>
      </div>
    );
  if (!legal)
    return (
      <div className="table-action-bar waiting-action">
        <span className="turn-dot" />
        <strong>
          {table.seats.find((s) => s.seat === table.actor)?.name || "The table"}{" "}
          to act
        </strong>
        {you?.status === "folded" && <span>You folded this hand</span>}
      </div>
    );
  return (
    <div className="table-action-bar your-action">
      <div className="action-row">
        <strong>Your turn</strong>
        <div className="live-button-group">
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => send({ type: "act", action: "fold" })}
          >
            Fold
          </Button>
          <Button
            disabled={disabled}
            onClick={() =>
              send({ type: "act", action: legal.check ? "check" : "call" })
            }
          >
            {legal.check
              ? "Check"
              : `Call ${legal.call.toLocaleString()}${legal.call === you?.stack ? " · All-in" : ""}`}
          </Button>
          {legal.minRaiseTo !== null && (
            <Button
              variant="secondary"
              disabled={disabled}
              aria-expanded={raising}
              onClick={() => setRaising(!raising)}
            >
              {table.currentBet === 0 ? "Bet" : "Raise"}
              <ChevronDown size={16} />
            </Button>
          )}
        </div>
      </div>
      {raising && legal.minRaiseTo !== null && (
        <form
          className="raise-controls"
          onSubmit={(e) => {
            e.preventDefault();
            send({ type: "act", action: "raise", raiseTo: amount });
          }}
        >
          <label htmlFor="raise-amount">
            {table.currentBet === 0 ? "Bet" : "Raise to"}
            <input
              id="raise-amount"
              type="number"
              inputMode="numeric"
              min={legal.minRaiseTo}
              max={legal.maxRaiseTo}
              step={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
          </label>
          <input
            aria-label="Raise amount slider"
            type="range"
            min={legal.minRaiseTo}
            max={legal.maxRaiseTo}
            value={clamp(amount)}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <div className="raise-presets">
            {[
              ["Min", legal.minRaiseTo],
              ["½ pot", table.currentBet + (table.pot + legal.call) / 2],
              ["Pot", table.currentBet + table.pot + legal.call],
              ["All-in", legal.maxRaiseTo],
            ].map(([label, value]) => (
              <button
                type="button"
                key={label}
                disabled={disabled}
                onClick={() => setAmount(clamp(Number(value)))}
              >
                {label}
              </button>
            ))}
          </div>
          <Button
            type="submit"
            disabled={
              disabled ||
              !Number.isSafeInteger(amount) ||
              amount < legal.minRaiseTo ||
              amount > legal.maxRaiseTo
            }
          >
            {amount === legal.maxRaiseTo
              ? `All-in · ${amount.toLocaleString()}`
              : `${table.currentBet === 0 ? "Bet" : "Raise to"} ${amount.toLocaleString()}`}
          </Button>
        </form>
      )}
    </div>
  );
}
