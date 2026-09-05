import { useState } from "react";
import { Bot, Copy, Check } from "lucide-react";
import type { TableView } from "@common/interfaces/tableInterfaces";
import { Button } from "@/components/ui/button";
import { tableService } from "@/services/tableService";

export function AgentSeats({
  table,
  accept,
  refresh,
}: {
  table: TableView;
  accept: (t: TableView) => void;
  refresh: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const issue = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setToken("");
    try {
      const result = await tableService.issueAgent(
        table.id,
        table.version,
        name,
        crypto.randomUUID(),
      );
      accept(result.table);
      setToken(result.token);
      setName("");
      setCopied(false);
    } catch (err) {
      setError((err as Error).message);
      await refresh();
    } finally {
      setBusy(false);
    }
  };
  const revoke = async (id: string) => {
    setBusy(true);
    setError("");
    try {
      accept(
        await tableService.revokeAgent(
          table.id,
          table.version,
          id,
          crypto.randomUUID(),
        ),
      );
    } catch (err) {
      setError((err as Error).message);
      await refresh();
    } finally {
      setBusy(false);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
    } catch {
      setError(
        "Clipboard access failed. Select and copy the credential field.",
      );
    }
  };
  return (
    <div className="agent-seats">
      <div className="agent-intro">
        <Bot size={27} />
        <span>One credential controls one seat.</span>
      </div>
      {error && (
        <div className="live-error" role="alert">
          {error}
        </div>
      )}
      <form className="agent-create-form" onSubmit={issue}>
        <label htmlFor="agent-name">Agent name</label>
        <div>
          <input
            id="agent-name"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Riverbot"
          />
          <Button
            type="submit"
            disabled={
              busy ||
              table.closed ||
              table.seats.length >= table.settings.maxPlayers
            }
          >
            Reserve seat
          </Button>
        </div>
      </form>
      {token && (
        <div className="agent-credential">
          <strong>Save this credential now</strong>
          <p>It is shown once and expires in seven days.</p>
          <input
            aria-label="Agent credential"
            readOnly
            value={token}
            type="password"
            autoComplete="off"
            onFocus={(e) => e.target.select()}
          />
          <Button variant="secondary" onClick={copy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy credential"}
          </Button>
          <Button variant="ghost" onClick={() => setToken("")}>
            Dismiss
          </Button>
        </div>
      )}
      <div className="agent-seat-list">
        {table.agents.map((a) => (
          <div key={a.id}>
            <Bot size={17} />
            <span>
              <strong>{a.name}</strong>
              <small>
                {a.revoked
                  ? "Revoked"
                  : `Seat ${a.seat + 1} · expires ${new Date(a.expiresAt).toLocaleDateString()}`}
              </small>
            </span>
            {(!a.revoked || a.seated) && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => revoke(a.id)}
              >
                {a.revoked ? "Remove seat" : "Revoke"}
              </Button>
            )}
          </div>
        ))}
      </div>
      <details className="mcp-setup">
        <summary>Connect with MCP</summary>
        <ol>
          <li>
            Install the MCP package: <code>cd mcp &amp;&amp; npm install</code>.
          </li>
          <li>
            Set your client’s command to <code>node</code> and its argument to
            the absolute path of <code>mcp/src/index.mjs</code>.
          </li>
          <li>
            Set <code>SHIPINSPECTOR_API_URL</code> to this API and{" "}
            <code>SHIPINSPECTOR_AGENT_TOKEN</code> to the seat credential.
          </li>
        </ol>
        <p>
          Use a separate connection for each agent. Start with{" "}
          <code>poker_get_table</code>, then <code>poker_ready</code>.
        </p>
        <p>
          Revoked agents in a live hand will time out. Remove their seat after
          the hand.
        </p>
      </details>
    </div>
  );
}
