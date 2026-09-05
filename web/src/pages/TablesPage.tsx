import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
  ArrowRight,
  Plus,
  Users,
  Gamepad2,
  BrainCircuit,
  LoaderCircle,
} from "lucide-react";
import type { TableSummary } from "@common/interfaces/tableInterfaces";
import { Button } from "@/components/ui/button";
import { tableService } from "@/services/tableService";

export default function TablesPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("Friday table");
  const [displayName, setDisplayName] = useState(
    user?.firstName || user?.username || "Player",
  );
  const [size, setSize] = useState(6);
  const [blind, setBlind] = useState(10);
  const [turn, setTurn] = useState(60);
  const [takeSeat, setTakeSeat] = useState(true);
  const [invite, setInvite] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setTables((await tableService.list()).tables);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const t = await tableService.create(
        {
          name,
          maxPlayers: size,
          smallBlind: blind / 2,
          bigBlind: blind,
          startingStack: blind * 100,
          turnSeconds: turn,
        },
        takeSeat ? displayName : undefined,
      );
      navigate(`/tables/${t.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const join = (event: React.FormEvent) => {
    event.preventDefault();
    const code = invite.trim().replace(/\/$/, "").split("/").pop() || "";
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(code)) {
      setError("Paste a valid table link or table ID.");
      return;
    }
    navigate(`/tables/${code}`);
  };
  return (
    <div className="tables-page">
      <header className="live-page-header">
        <div>
          <span className="eyebrow">PLAY CHIPS · NO CASH VALUE</span>
          <h1>Private tables</h1>
        </div>
        <Button onClick={() => setCreating(!creating)}>
          <Plus size={17} />
          {creating ? "Close setup" : "Create table"}
        </Button>
      </header>
      {error && (
        <div className="live-error" role="alert">
          {error}
          <Button variant="ghost" size="sm" onClick={load}>
            Retry
          </Button>
        </div>
      )}
      <div className="lobby-layout">
        <section className="lobby-tables" aria-label="Your tables">
          {loading ? (
            <div className="live-empty">
              <LoaderCircle className="animate-spin" />
              <span>Loading tables</span>
            </div>
          ) : tables.length ? (
            <div className="table-list">
              {tables.map((t) => (
                <Link
                  className="table-list-row"
                  to={`/tables/${t.id}`}
                  key={t.id}
                >
                  <span className="table-list-icon">
                    <Users size={21} />
                  </span>
                  <div>
                    <strong>{t.name}</strong>
                    <span>
                      {t.smallBlind}/{t.bigBlind} · {t.seats}/{t.maxPlayers}{" "}
                      seats
                    </span>
                  </div>
                  <span className="table-phase">
                    {t.street === "waiting"
                      ? "Waiting"
                      : t.street === "complete"
                        ? "Between hands"
                        : "In play"}
                  </span>
                  <ArrowRight size={18} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="live-empty lobby-empty">
              <div className="empty-table-art" aria-hidden="true">
                <span>♠</span>
                <i />
                <i />
              </div>
              <h2>Take a seat</h2>
              <Button onClick={() => setCreating(true)}>
                <Plus size={17} />
                Create your first table
              </Button>
            </div>
          )}
          <form className="join-table-form" onSubmit={join}>
            <label htmlFor="table-invite">Join with an invite</label>
            <div>
              <input
                id="table-invite"
                value={invite}
                onChange={(e) => setInvite(e.target.value)}
                placeholder="Table link or ID"
                required
                autoComplete="off"
              />
              <Button variant="secondary" type="submit">
                Join table
                <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        </section>
        {creating ? (
          <form className="live-panel create-table-form" onSubmit={create}>
            <h2>Create a table</h2>
            <label>
              Table name
              <input
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <div className="live-form-grid">
              <label>
                Seats
                <select
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                >
                  {[2, 4, 6, 8].map((n) => (
                    <option key={n} value={n}>
                      {n} players
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Blinds
                <select
                  value={blind}
                  onChange={(e) => setBlind(Number(e.target.value))}
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n / 2} / {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Turn time
              <select
                value={turn}
                onChange={(e) => setTurn(Number(e.target.value))}
              >
                {[30, 60, 90, 120].map((n) => (
                  <option key={n} value={n}>
                    {n} seconds
                  </option>
                ))}
              </select>
            </label>
            <div className="table-buyin">
              <span>Starting stack</span>
              <strong>{(blind * 100).toLocaleString()} chips</strong>
            </div>
            <label className="live-checkbox">
              <input
                type="checkbox"
                checked={takeSeat}
                onChange={(e) => setTakeSeat(e.target.checked)}
              />
              Take a seat
            </label>
            {takeSeat && (
              <label>
                Your name
                <input
                  value={displayName}
                  maxLength={40}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </label>
            )}
            <Button type="submit" disabled={busy}>
              {busy ? "Creating…" : "Open table"}
              <ArrowRight size={17} />
            </Button>
          </form>
        ) : (
          <aside className="live-panel lobby-agent-note">
            <Gamepad2 size={30} strokeWidth={1.6} />
            <h2>Play against CPU players</h2>
            <Button
              variant="secondary"
              onClick={() => {
                setTakeSeat(true);
                setCreating(true);
              }}
            >
              Create a practice table
              <ArrowRight size={16} />
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setTakeSeat(false);
                setCreating(true);
              }}
            >
              <BrainCircuit size={17} />
              Set up an agent table
            </Button>
          </aside>
        )}
      </div>
    </div>
  );
}
