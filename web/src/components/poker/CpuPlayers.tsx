import { useState } from "react";
import { Crosshair, Dices, Flame, Plus, Users, Waves, X } from "lucide-react";
import { BOT_PROFILES, BOT_STYLES } from "@common/pokerBots";
import type {
  BotStyle,
  TableCommand,
  TableView,
} from "@common/interfaces/tableInterfaces";
import { Button } from "@/components/ui/button";

const icons = {
  aggressive: Flame,
  passive: Waves,
  balanced: Crosshair,
  random: Dices,
};
export function BotIcon({
  style,
  size = 20,
}: {
  style: BotStyle;
  size?: number;
}) {
  const Icon = icons[style];
  return <Icon size={size} aria-hidden="true" />;
}
export function CpuPlayers({
  table,
  disabled,
  busy,
  error,
  retry,
  send,
}: {
  table: TableView;
  disabled: boolean;
  busy: boolean;
  error?: string;
  retry?: () => void;
  send: (command: TableCommand) => void;
}) {
  const [style, setStyle] = useState<BotStyle>("balanced");
  const openSeats = table.settings.maxPlayers - table.seats.length;
  const between = ["waiting", "complete"].includes(table.street);
  const locked = disabled || table.closed || !between;
  const bots = table.seats.filter((s) => s.kind === "cpu");
  return (
    <div className="cpu-players">
      {error && (
        <div className="live-error" role="alert">
          {error}
          {retry && (
            <Button size="sm" disabled={busy} onClick={retry}>
              Retry same action
            </Button>
          )}
        </div>
      )}
      <fieldset className="cpu-picker" disabled={locked || !openSeats}>
        <legend>Choose a play style</legend>
        {BOT_STYLES.map((key) => (
          <label
            key={key}
            className={`cpu-profile cpu-${key} ${style === key ? "is-selected" : ""}`}
          >
            <input
              type="radio"
              name="cpu-style"
              value={key}
              checked={style === key}
              onChange={() => setStyle(key)}
            />
            <span className="cpu-portrait">
              <BotIcon style={key} size={26} />
            </span>
            <span>
              <strong>{BOT_PROFILES[key].name}</strong>
              <span>{BOT_PROFILES[key].label}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="cpu-tendency" aria-live="polite">
        {BOT_PROFILES[style].tendency}
      </div>
      <Button
        disabled={locked || !openSeats}
        onClick={() => send({ type: "add-bots", styles: [style] })}
      >
        <Plus size={17} /> Add {BOT_PROFILES[style].name}
      </Button>
      <Button
        variant="outline"
        disabled={locked || !openSeats}
        onClick={() =>
          send({
            type: "add-bots",
            styles: Array.from(
              { length: Math.min(8, openSeats) },
              (_, i) => BOT_STYLES[i % BOT_STYLES.length],
            ),
          })
        }
      >
        <Users size={17} /> Fill open seats · Mixed styles
      </Button>
      {!between && <p role="status">Manage CPU players after this hand.</p>}
      {!openSeats && <p role="status">All seats are taken.</p>}
      {bots.length > 0 && (
        <section className="cpu-roster" aria-label="Seated CPU players">
          {bots.map((bot) => (
            <div
              key={bot.seat}
              className={`cpu-roster-row cpu-${bot.botStyle || "balanced"}`}
            >
              <span className="cpu-portrait">
                <BotIcon style={bot.botStyle || "balanced"} />
              </span>
              <span>
                <strong>{bot.name}</strong>
                <span>
                  {BOT_PROFILES[bot.botStyle || "balanced"].label} · CPU
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${bot.name}`}
                disabled={locked}
                onClick={() => send({ type: "remove-bot", seat: bot.seat })}
              >
                <X size={17} />
              </Button>
            </div>
          ))}
        </section>
      )}
      <p className="cpu-rules">
        CPUs see only their own cards. Empty CPU stacks refill with play chips
        on the next deal.
      </p>
    </div>
  );
}
