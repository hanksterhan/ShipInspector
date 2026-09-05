import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Download,
  Upload,
  RotateCcw,
  Users,
  Crown,
  Layers,
  Plus,
} from "lucide-react";
import { useEquityCalculatorStore } from "@/stores";
import { useOutsCalculation } from "@/hooks/useOutsCalculation";
import { PokerTable } from "@/components/poker/PokerTable";
import { CardPickerModal } from "@/components/poker/CardPickerModal";
import { EquityDisplay } from "@/components/poker/EquityDisplay";
import { OutsDisplay } from "@/components/poker/OutsDisplay";
import { Button } from "@/components/ui/button";
import { PlayingCard } from "@/components/poker/PlayingCard";
import { parseScenario, STUDY_EXAMPLES } from "@/lib/poker/scenario";
import { cn } from "@/lib/utils";

export default function EquityCalculatorPage() {
  const state = useEquityCalculatorStore();
  const {
    players,
    activePlayers,
    board,
    scope,
    pickerOpen,
    equity,
    closePicker,
    setCard,
    isCardUsed,
    dispose,
    resetAll,
    loadScenario,
  } = state;
  const outs = useOutsCalculation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const seats = [...activePlayers].sort((a, b) => a - b);
  const boardCount = board.filter(Boolean).length;
  const street =
    boardCount === 0
      ? "Preflop"
      : boardCount <= 3
        ? "Flop"
        : boardCount === 4
          ? "Turn"
          : "River";
  const complete = seats.filter((index) =>
    players[index].every(Boolean),
  ).length;
  const winners = state.getWinningPlayers();
  const hasResult = equity.status === "success";
  const isShowdown = boardCount === 5 && hasResult && winners.length > 0;
  const selectedLabel =
    scope.kind === "player"
      ? `Player ${scope.playerIndex + 1} · Card ${scope.cardIndex + 1}`
      : `${scope.boardIndex < 3 ? "Flop" : scope.boardIndex === 3 ? "Turn" : "River"} · Card ${scope.boardIndex + 1}`;
  const nextPlayer = seats.find((index) => players[index].some((c) => !c));

  useEffect(() => {
    void useEquityCalculatorStore.getState().checkAndCalculateEquity();
    return dispose;
  }, [dispose]);

  function startCards() {
    if (nextPlayer !== undefined)
      state.setScope({
        kind: "player",
        playerIndex: nextPlayer,
        cardIndex: players[nextPlayer][0] ? 1 : 0,
      });
    else
      state.setScope({
        kind: "board",
        boardIndex: Math.max(
          0,
          board.findIndex((c) => !c),
        ),
      });
    state.openPicker();
  }

  function exportStudy() {
    try {
      const study = parseScenario({
        version: 1,
        variant: "texas-holdem",
        players: seats.map((seat) => ({ seat, cards: players[seat] })),
        board,
      });
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(study, null, 2)], {
          type: "application/json",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "ship-inspector-study.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setFileError(null);
    } catch (error) {
      setFileError((error as Error).message);
    }
  }

  return (
    <div className="equity-page">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">THE STUDY ROOM</div>
          <h1>Equity Calculator</h1>
        </div>
        <div className="page-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={15} />
            Import
          </Button>
          <Button variant="ghost" size="sm" onClick={exportStudy}>
            <Download size={15} />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetAll();
              setFileError(null);
            }}
          >
            <RotateCcw size={15} />
            New Hand
          </Button>
        </div>
      </div>
      <input
        type="file"
        accept=".json,application/json"
        ref={inputRef}
        className="sr-only"
        tabIndex={-1}
        aria-label="Import study file"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          try {
            if (file.size > 100_000)
              throw new Error("Choose a study file smaller than 100 KB.");
            loadScenario(parseScenario(JSON.parse(await file.text())));
            setFileError(null);
          } catch (error) {
            setFileError(
              error instanceof Error
                ? error.message
                : "Could not read this study file.",
            );
          }
        }}
      />
      {fileError && (
        <div role="alert" className="inline-error">
          {fileError}
        </div>
      )}
      <div className="study-layout">
        <section className="table-panel" aria-label="Study table">
          <div className="table-toolbar">
            <span className="table-type">
              <Layers size={16} />
              No-limit Hold’em
            </span>
            <span className="player-count">
              <Users size={15} />
              {activePlayers.size} players
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={activePlayers.size >= 8}
              onClick={() => {
                const seat = players.findIndex((_, i) => !activePlayers.has(i));
                state.addPlayer(seat);
              }}
              aria-label="Add player"
            >
              <Plus size={15} />
              <span className="add-player-label">Add player</span>
            </Button>
          </div>
          <div className="street-progress" aria-label="Current street">
            {["Preflop", "Flop", "Turn", "River"].map((name, index) => (
              <span
                key={name}
                className={cn(name === street && "current-street")}
                aria-current={name === street ? "step" : undefined}
              >
                <small>{String(index + 1).padStart(2, "0")}</small>
                {name}
                {index < 3 && <ChevronRight size={12} />}
              </span>
            ))}
          </div>
          <PokerTable />
          <div className="table-bottom">
            <span>
              <span className="status-dot" />
              {boardCount > 0 && boardCount < 3
                ? `Complete the flop · ${3 - boardCount} cards left`
                : `${complete} of ${activePlayers.size} hands ready`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
              aria-expanded={showHelp}
            >
              <CircleHelp size={15} />
              How to use
            </Button>
          </div>
          {showHelp && (
            <div className="table-help">
              Choose two cards for each player. Add the flop, turn, or river to
              compare a later street. Click a card to replace it. Clearing a
              board card also clears later cards.
            </div>
          )}
        </section>
        <aside className="analysis-panel" aria-label="Hand analysis">
          <div className="analysis-heading">
            <h2>Hand analysis</h2>
            <span className="live-badge">AUTO</span>
          </div>
          {isShowdown ? (
            <div
              className="showdown-result"
              role="status"
              key={
                board.map((c) => (c ? `${c.rank}${c.suit}` : "")).join("") +
                winners.join("")
              }
            >
              <div className="winner-emblem">
                <Crown size={28} strokeWidth={1.5} />
                <span className="winner-ring" />
              </div>
              <span className="eyebrow">SHOWDOWN</span>
              <h3>
                {winners.length > 1
                  ? "Split pot"
                  : `Player ${winners[0] + 1} wins`}
              </h3>
              {state.getWinningHandName() && (
                <p>{state.getWinningHandName()}</p>
              )}
            </div>
          ) : !hasResult &&
            equity.status !== "loading" &&
            equity.status !== "error" ? (
            <div className="analysis-empty">
              <div className="empty-cards" aria-hidden="true">
                <span>A♠</span>
                <span>K♥</span>
              </div>
              <h3>
                {complete === activePlayers.size
                  ? "Complete the flop"
                  : "Set up your hand"}
              </h3>
              <p>
                {complete === activePlayers.size
                  ? "Add all three flop cards to calculate this street."
                  : "Choose two cards for each player to see their share of the pot."}
              </p>
              <Button onClick={startCards}>
                {complete === 0 ? "Choose cards" : "Continue hand"}
                <ArrowRight size={16} />
              </Button>
            </div>
          ) : (
            <div className="analysis-summary">
              <span className="eyebrow">{street.toUpperCase()} EQUITY</span>
              <strong>
                {activePlayers.size}
                <span> players in the hand</span>
              </strong>
            </div>
          )}
          <div className="analysis-status">
            <EquityDisplay />
            {equity.status === "error" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void state.checkAndCalculateEquity()}
              >
                Retry calculation
              </Button>
            )}
          </div>
          <div className="equity-results">
            {seats.map((index) => {
              const win = (equity.playerEquity.get(index) ?? 0) * 100;
              const tie = (equity.playerTieEquity.get(index) ?? 0) * 100;
              return (
                <div
                  className={cn(
                    "equity-result-row",
                    isShowdown && winners.includes(index) && "result-winner",
                  )}
                  key={index}
                >
                  <div className="result-player">
                    <span className="result-dot" data-seat={index % 4} />
                    Player {index + 1}
                    <strong>
                      {hasResult ? `${(win + tie).toFixed(1)}%` : "—"}
                    </strong>
                  </div>
                  <div className="equity-meter">
                    <span
                      style={{
                        transform: `scaleX(${hasResult ? (win + tie) / 100 : 0})`,
                      }}
                    />
                  </div>
                  <div className="result-breakdown">
                    {hasResult ? (
                      <>
                        <span>Win {win.toFixed(1)}%</span>
                        <span>Tie share {tie.toFixed(1)}%</span>
                      </>
                    ) : (
                      <span>
                        {players[index].every(Boolean) ? (
                          <>
                            <Check size={11} />
                            Cards ready
                          </>
                        ) : (
                          "2 cards needed"
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {hasResult && (
            <p className="equity-definition">
              Equity = wins + your share of tied pots. All hands run to
              showdown; bets and folds are not included.
            </p>
          )}
          {(outs.data || outs.loading || outs.error) && (
            <div className="outs-panel">
              <h3>Player {seats[0] + 1} · River outs</h3>
              <OutsDisplay
                data={outs.data}
                loading={outs.loading}
                error={outs.error}
              />
            </div>
          )}
        </aside>
      </div>
      <section className="example-section" aria-label="Example hands">
        <div className="example-heading">
          <span className="eyebrow">EXPLORE A SPOT</span>
          <h2>Start with a hand.</h2>
        </div>
        <div className="example-list">
          {STUDY_EXAMPLES.map((example) => (
            <button
              className="example-button"
              key={example.label}
              onClick={() => {
                loadScenario(example.scenario);
                setFileError(null);
              }}
            >
              <span className="example-cards" aria-hidden="true">
                {example.scenario.players[0].cards.map((card, index) => (
                  <PlayingCard key={index} card={card} label="Example" small />
                ))}
              </span>
              <span>
                <strong>{example.label}</strong>
                <small>{example.stage}</small>
              </span>
              <ArrowRight size={17} />
            </button>
          ))}
        </div>
      </section>
      <footer className="workspace-footer">
        <span>
          SHIP INSPECTOR <span>/</span> A better read on every hand.
        </span>
        <span>Study · Review · Repeat</span>
      </footer>
      <CardPickerModal
        isOpen={pickerOpen}
        onClose={closePicker}
        onSelectCard={(card) => {
          const before = useEquityCalculatorStore.getState().scope;
          const accepted = setCard(card);
          const current = useEquityCalculatorStore.getState();
          if (accepted) {
            if (before.kind === "player") {
              const missing = current.players[before.playerIndex].findIndex(
                (c) => !c,
              );
              if (missing < 0) closePicker();
              else
                current.setScope({
                  kind: "player",
                  playerIndex: before.playerIndex,
                  cardIndex: missing as 0 | 1,
                });
            } else if (before.boardIndex < 3) {
              const missing = current.board.slice(0, 3).findIndex((c) => !c);
              if (missing < 0) closePicker();
              else current.setScope({ kind: "board", boardIndex: missing });
            } else closePicker();
          }
          return accepted;
        }}
        isCardUsed={isCardUsed}
        title={selectedLabel}
        keepOpen
      />
    </div>
  );
}
