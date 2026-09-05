import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
  ArrowLeft,
  Bot,
  Check,
  Copy,
  Crown,
  LoaderCircle,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { LiveTable } from "@/components/poker/LiveTable";
import { TableActions } from "@/components/poker/TableActions";
import { AgentSeats } from "@/components/poker/AgentSeats";
import { useLiveTable } from "@/hooks/useLiveTable";

export default function TablePage() {
  const { tableId = "" } = useParams();
  const { user } = useUser();
  const live = useLiveTable(tableId);
  const { table } = live;
  const [name, setName] = useState(
    user?.firstName || user?.username || "Player",
  );
  const [agentsOpen, setAgentsOpen] = useState(false);
  const agentTrigger = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (live.loading)
    return (
      <div className="live-empty">
        <LoaderCircle className="animate-spin" />
        <span>Opening table</span>
      </div>
    );
  if (!table || live.needsJoin)
    return (
      <div className="table-join-screen">
        <Link to="/tables">
          <ArrowLeft size={16} />
          Private tables
        </Link>
        <div className="live-panel">
          <h1>{live.needsJoin ? "Take your seat" : "Table unavailable"}</h1>
          {live.error && (
            <p className="live-error" role="alert">
              {live.error}
            </p>
          )}
          {live.needsJoin ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void live.send({ type: "join", name });
              }}
            >
              <label>
                Your name
                <input
                  value={name}
                  maxLength={40}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <Button type="submit" disabled={live.busy}>
                Join table
              </Button>
            </form>
          ) : (
            <Button onClick={() => live.refresh()}>Try again</Button>
          )}
        </div>
      </div>
    );
  const remaining =
    table.deadline === null
      ? null
      : Math.max(
          0,
          Math.ceil(
            (table.deadline -
              table.serverTime -
              (now - live.receivedAt.current)) /
              1000,
          ),
        );
  const disabled =
    live.busy ||
    !!live.retry ||
    !live.connected ||
    (table.legal !== null && remaining === 0);
  const between = ["waiting", "complete"].includes(table.street);
  const awards = [
    ...new Set(table.awards.flatMap((p) => p.winners.map((w) => w.seat))),
  ];
  const winner =
    awards.length === 1
      ? table.seats.find((s) => s.seat === awards[0])?.name
      : null;
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/tables/${table.id}`,
      );
      setCopied(true);
      setCopyError("");
    } catch {
      setCopyError("Copy the table link from your browser address bar.");
    }
  };
  return (
    <div className="live-table-page">
      <header className="live-page-header">
        <div>
          <Link className="back-to-tables" to="/tables">
            <ArrowLeft size={15} />
            Private tables
          </Link>
          <h1>{table.settings.name}</h1>
          <div className="live-table-stakes">
            <span>
              {table.settings.smallBlind}/{table.settings.bigBlind}
            </span>
            <span>
              {table.seats.length}/{table.settings.maxPlayers} seats
            </span>
            <span>Play chips</span>
          </div>
        </div>
        <div className="live-button-group">
          <Button variant="outline" onClick={copyInvite}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Link copied" : "Invite"}
          </Button>
          {table.isOwner && (
            <Button
              ref={agentTrigger}
              variant="secondary"
              onClick={() => setAgentsOpen(true)}
            >
              <Bot size={17} />
              Agent seats
            </Button>
          )}
        </div>
      </header>
      {!live.connected && (
        <div className="live-error" role="status">
          <WifiOff size={17} />
          Reconnecting. The turn clock continues.
        </div>
      )}
      {(live.error || copyError) && (
        <div className="live-error" role="alert">
          {live.error || copyError}
          {live.retry && (
            <Button size="sm" disabled={live.busy} onClick={live.retryAction}>
              Retry same action
            </Button>
          )}
        </div>
      )}
      <div className="live-game-layout">
        <section className="live-game-main">
          <div className="live-hand-status">
            <span>HAND {String(table.handNumber).padStart(2, "0")}</span>
            <strong role="status">
              {table.closed
                ? "Table closed"
                : table.street === "waiting"
                  ? "Waiting for players"
                  : table.street === "complete"
                    ? "Hand complete"
                    : table.street[0].toUpperCase() + table.street.slice(1)}
            </strong>
            {remaining !== null && (
              <span
                className={
                  remaining <= 10 ? "turn-clock is-urgent" : "turn-clock"
                }
                aria-label={`${remaining} seconds left`}
              >
                {remaining}s
              </span>
            )}
          </div>
          <LiveTable table={table} />
          {table.street === "complete" && (
            <div className="live-result" key={table.handNumber} role="status">
              <Crown size={26} />
              <div>
                <strong>
                  {winner
                    ? `${winner} wins`
                    : table.awards.length === 1
                      ? "Split pot"
                      : "Pots awarded"}
                </strong>
                <span>
                  {table.awards
                    .map((p) =>
                      p.winners
                        .map(
                          (w) =>
                            `${table.seats.find((s) => s.seat === w.seat)?.name}: ${w.amount.toLocaleString()} · ${w.hand}`,
                        )
                        .join(" / "),
                    )
                    .join(" · ")}
                </span>
              </div>
            </div>
          )}
          <TableActions
            key={`${table.handNumber}:${table.street}:${table.currentBet}:${table.actor}`}
            table={table}
            disabled={disabled}
            send={(command) => void live.send(command)}
          />
          {table.yourSeat === null && !table.closed && (
            <form
              className="take-seat-inline"
              onSubmit={(e) => {
                e.preventDefault();
                void live.send({ type: "join", name });
              }}
            >
              <label htmlFor="take-seat-name">Your name</label>
              <input
                id="take-seat-name"
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Button
                disabled={
                  disabled || table.seats.length >= table.settings.maxPlayers
                }
                type="submit"
              >
                Take a seat
              </Button>
            </form>
          )}
        </section>
        <aside className="live-panel live-activity">
          <h2>Table activity</h2>
          <ol>
            {[...table.events]
              .reverse()
              .slice(0, 20)
              .map((event) => (
                <li key={event.id}>
                  <span>{String(event.hand).padStart(2, "0")}</span>
                  {event.text}
                </li>
              ))}
          </ol>
          {!table.events.length && (
            <div className="activity-empty">Waiting for the first hand</div>
          )}
          <div className="live-table-rule">
            {table.settings.turnSeconds}s turns · No cash value
          </div>
        </aside>
      </div>
      <Sheet open={agentsOpen} onOpenChange={setAgentsOpen}>
        <SheetContent
          className="agent-sheet"
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            agentTrigger.current?.focus();
          }}
        >
          <SheetTitle>Agent seats</SheetTitle>
          {agentsOpen && (
            <AgentSeats
              table={table}
              accept={live.accept}
              refresh={live.refresh}
            />
          )}
          {between && table.isOwner && !table.closed && (
            <Button
              variant="outline"
              disabled={disabled}
              onClick={() => {
                void live.send({ type: "close" });
                setAgentsOpen(false);
              }}
            >
              Close table
            </Button>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
