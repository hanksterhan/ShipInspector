import { useEffect, useCallback } from "react";
import { useHandReplayStore } from "@/stores/useHandReplayStore";
import {
  selectCurrentAction,
  selectCurrentStreet,
  selectIsComplete,
  selectTotalActions,
} from "@/stores/useHandReplayStore";
import { formatActionDescription } from "@/lib/poker/actionFormatting";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
} from "@/assets/icons";
import { cn } from "@/lib/utils";

const STREETS = ["preflop", "flop", "turn", "river"] as const;
const SPEED_MIN = 100;
const SPEED_MAX = 2000;
const SPEED_STEP = 100;

export function ReplayControls() {
  const hand = useHandReplayStore((s) => s.hand);
  const currentActionIndex = useHandReplayStore((s) => s.currentActionIndex);
  const isPlaying = useHandReplayStore((s) => s.isPlaying);
  const playbackSpeed = useHandReplayStore((s) => s.playbackSpeed);
  const totalActions = useHandReplayStore(selectTotalActions);
  const currentAction = useHandReplayStore(selectCurrentAction);
  const currentStreet = useHandReplayStore(selectCurrentStreet);
  const isComplete = useHandReplayStore(selectIsComplete);

  const play = useHandReplayStore((s) => s.play);
  const pause = useHandReplayStore((s) => s.pause);
  const stepForward = useHandReplayStore((s) => s.stepForward);
  const stepBack = useHandReplayStore((s) => s.stepBack);
  const reset = useHandReplayStore((s) => s.reset);
  const setPlaybackSpeed = useHandReplayStore((s) => s.setPlaybackSpeed);
  const setActionIndex = useHandReplayStore((s) => s.setActionIndex);
  const jumpToStreet = useHandReplayStore((s) => s.jumpToStreet);

  const hasActions = totalActions > 0;
  const maxIndex = Math.max(0, totalActions - 1);
  const timelineValue = currentActionIndex >= 0 ? currentActionIndex : 0;

  const actionDescription =
    hand && currentAction
      ? formatActionDescription(currentAction, hand.players)
      : "—";

  const handlePlayPause = useCallback(() => {
    if (isComplete) return;
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, isComplete, play, pause]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hand || hasActions === false) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          handlePlayPause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          stepBack();
          break;
        case "ArrowRight":
          e.preventDefault();
          stepForward();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hand, hasActions, handlePlayPause, stepBack, stepForward]);

  if (!hand) return null;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      {/* Main controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => stepBack()}
          disabled={!hasActions || currentActionIndex < 0}
          aria-label="Step back"
        >
          <SkipBack className="size-4" />
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={handlePlayPause}
          disabled={!hasActions || isComplete}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" />
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => stepForward()}
          disabled={!hasActions || isComplete}
          aria-label="Step forward"
        >
          <SkipForward className="size-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => reset()}
          disabled={!hasActions}
          aria-label="Reset to start"
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      {/* Timeline slider */}
      {hasActions && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Action {currentActionIndex + 1} of {totalActions}</span>
          </div>
          <Slider
            min={0}
            max={maxIndex}
            step={1}
            value={[timelineValue]}
            onValueChange={([v]) => setActionIndex(v)}
            className="w-full"
          />
        </div>
      )}

      {/* Speed control */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground shrink-0">Speed</span>
        <Slider
          min={SPEED_MIN}
          max={SPEED_MAX}
          step={SPEED_STEP}
          value={[playbackSpeed]}
          onValueChange={([v]) => setPlaybackSpeed(v)}
          className="flex-1"
        />
        <span className="text-xs font-mono w-12 shrink-0">
          {(1000 / playbackSpeed).toFixed(1)}x
        </span>
      </div>

      {/* Street indicators */}
      <div className="flex flex-wrap gap-1">
        {STREETS.map((street) => (
          <Button
            key={street}
            variant="outline"
            size="xs"
            className={cn(
              "capitalize",
              currentStreet === street && "bg-primary/10 border-primary",
            )}
            onClick={() => jumpToStreet(street)}
          >
            {street}
          </Button>
        ))}
      </div>

      {/* Current action description */}
      <div className="rounded bg-muted/50 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Current: </span>
        <span className="font-medium">{actionDescription}</span>
      </div>
    </div>
  );
}
