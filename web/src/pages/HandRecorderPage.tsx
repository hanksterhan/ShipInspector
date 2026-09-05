import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Card } from "@common/interfaces";
import { useHandRecorderStore, useSettingsStore } from "@/stores";
import { CardPickerModal } from "@/components/poker/CardPickerModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ActionRecorder,
  BoardCardsSection,
  GameSettingsForm,
  PlayerSetupSection,
} from "@/components/hand-recorder";
import type { CardPickerTarget } from "@/components/hand-recorder/BoardCardsSection";

type ToastState = { type: "success" | "error"; message: string };

export default function HandRecorderPage() {
  const navigate = useNavigate();
  const gameSettings = useHandRecorderStore((s) => s.gameSettings);
  const players = useHandRecorderStore((s) => s.players);
  const actions = useHandRecorderStore((s) => s.actions);
  const isDraft = useHandRecorderStore((s) => s.isDraft);
  const isHydrating = useHandRecorderStore((s) => s._isHydrating);
  const loadDraft = useHandRecorderStore((s) => s.loadDraft);
  const submitHand = useHandRecorderStore((s) => s.submitHand);
  const setBoardCard = useHandRecorderStore((s) => s.setBoardCard);
  const setPlayerHoleCard = useHandRecorderStore((s) => s.setPlayerHoleCard);
  const isCardUsed = useHandRecorderStore((s) => s.isCardUsed);
  const clearValidationErrors = useHandRecorderStore(
    (s) => s.clearValidationErrors,
  );

  const wizardMode = useSettingsStore((s) => s.wizardMode);
  const toggleWizardMode = useSettingsStore((s) => s.toggleWizardMode);

  const steps = ["game-context", "players", "actions", "board-review"];
  const [step, setStep] = useState("game-context");
  const stepIndex = steps.indexOf(step);
  const [pickerTarget, setPickerTarget] = useState<CardPickerTarget>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    loadDraft().catch(() => undefined);
  }, [loadDraft]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (nextToast: ToastState) => {
    setToast(nextToast);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const currentTargetCard = useMemo(() => {
    if (!pickerTarget) return null;
    if (pickerTarget.kind === "board") {
      return gameSettings.board[pickerTarget.index];
    }
    const player = players.find((p) => p.seatIndex === pickerTarget.seatIndex);
    return player?.showdownCards[pickerTarget.cardIndex] ?? null;
  }, [pickerTarget, gameSettings.board, players]);

  const isCardUsedForPicker = (card: Card) => {
    if (
      currentTargetCard &&
      currentTargetCard.rank === card.rank &&
      currentTargetCard.suit === card.suit
    ) {
      return false;
    }
    return isCardUsed(card);
  };

  const handleSelectCard = (card: Card) => {
    if (!pickerTarget) return false;
    if (pickerTarget.kind === "board") {
      setBoardCard(pickerTarget.index, card);
    } else {
      setPlayerHoleCard(pickerTarget.seatIndex, pickerTarget.cardIndex, card);
    }
    return true;
  };

  const minimumRequirementsMet = useMemo(() => {
    const { tableSize, buttonSeat, smallBlind, bigBlind, ante } = gameSettings;
    if (tableSize < 2 || tableSize > 9) return false;
    if (buttonSeat < 0 || buttonSeat >= tableSize) return false;
    if (smallBlind <= 0) return false;
    if (bigBlind <= 0 || bigBlind <= smallBlind) return false;
    if (ante < 0) return false;
    const activePlayers = players.filter((p) => p.isActive);
    if (activePlayers.length < 2) return false;
    if (
      activePlayers.some((p) => !p.displayName.trim() || p.stackAtStart <= 0)
    ) {
      return false;
    }
    if (actions.length === 0) return false;
    return true;
  }, [actions.length, gameSettings, players]);

  const handleSave = async () => {
    clearValidationErrors();
    setIsSaving(true);
    try {
      const handId = await submitHand();
      if (handId) {
        showToast({ type: "success", message: "Hand saved. Redirecting..." });
        window.setTimeout(() => {
          navigate("/hands/library");
        }, 600);
      } else {
        showToast({
          type: "error",
          message: "Please fix validation errors before saving.",
        });
      }
    } catch {
      showToast({ type: "error", message: "Failed to save hand." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative flex-1 overflow-auto flex flex-col gap-4 p-4">
      {toast ? (
        <div
          role="alert"
          aria-live="assertive"
          className={`fixed right-6 top-6 z-50 rounded-lg border px-4 py-2 text-sm shadow-lg ${
            toast.type === "success"
              ? "border-primary/50 bg-card text-primary"
              : "border-destructive/50 bg-destructive/10 text-destructive"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Record Hand</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={toggleWizardMode}
            title={
              wizardMode ? "Switch to All-in-One mode" : "Switch to Wizard mode"
            }
          >
            {wizardMode ? "Show all fields" : "Step by step"}
          </Button>
          {isDraft && <Badge variant="secondary">Draft saved</Badge>}
          <Button
            onClick={handleSave}
            disabled={!minimumRequirementsMet || isSaving || isHydrating}
          >
            {isSaving ? "Saving..." : "Save Hand"}
          </Button>
        </div>
      </div>

      {wizardMode ? (
        <Tabs value={step} onValueChange={setStep} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="game-context">1. Table</TabsTrigger>
            <TabsTrigger value="players">2. Players</TabsTrigger>
            <TabsTrigger value="actions">3. Actions</TabsTrigger>
            <TabsTrigger value="board-review">4. Review</TabsTrigger>
          </TabsList>
          <TabsContent value="game-context">
            <GameSettingsForm />
          </TabsContent>
          <TabsContent value="players">
            <PlayerSetupSection
              activeTarget={pickerTarget}
              onPickCard={(target) => setPickerTarget(target)}
              onClearCard={(seatIndex, cardIndex) =>
                setPlayerHoleCard(seatIndex, cardIndex, null)
              }
            />
          </TabsContent>
          <TabsContent value="actions">
            <ActionRecorder />
          </TabsContent>
          <TabsContent value="board-review">
            <div className="space-y-4">
              <BoardCardsSection
                activeTarget={pickerTarget}
                onPickCard={(target) => setPickerTarget(target)}
                onClearCard={(index) => setBoardCard(index, null)}
              />
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-2 text-sm font-semibold">Hand Summary</h3>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    Players: {players.filter((p) => p.isActive).length} active
                  </p>
                  <p>Actions: {actions.length} recorded</p>
                  <p>
                    Board: {gameSettings.board.filter((c) => c !== null).length}{" "}
                    cards
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          <div className="wizard-footer">
            <Button
              variant="outline"
              disabled={stepIndex === 0}
              onClick={() => setStep(steps[stepIndex - 1])}
            >
              Previous
            </Button>
            <span>Step {stepIndex + 1} of 4</span>
            {stepIndex < 3 ? (
              <Button onClick={() => setStep(steps[stepIndex + 1])}>
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={!minimumRequirementsMet || isSaving || isHydrating}
              >
                {isSaving ? "Saving…" : "Save Hand"}
              </Button>
            )}
          </div>
        </Tabs>
      ) : (
        <>
          <GameSettingsForm />
          <PlayerSetupSection
            activeTarget={pickerTarget}
            onPickCard={(target) => setPickerTarget(target)}
            onClearCard={(seatIndex, cardIndex) =>
              setPlayerHoleCard(seatIndex, cardIndex, null)
            }
          />
          <BoardCardsSection
            activeTarget={pickerTarget}
            onPickCard={(target) => setPickerTarget(target)}
            onClearCard={(index) => setBoardCard(index, null)}
          />
          <ActionRecorder />
        </>
      )}

      <CardPickerModal
        isOpen={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelectCard={handleSelectCard}
        isCardUsed={isCardUsedForPicker}
      />
    </div>
  );
}
