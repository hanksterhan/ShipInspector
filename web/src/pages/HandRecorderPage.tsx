import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Card } from "@common/interfaces";
import { useHandRecorderStore } from "@/stores";
import { CardPickerModal } from "@/components/poker/CardPickerModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      activePlayers.some(
        (p) => !p.displayName.trim() || p.stackAtStart <= 0,
      )
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
    <div className="relative flex flex-col gap-4 p-4">
      {toast ? (
        <div
          role="alert"
          aria-live="assertive"
          className={`fixed right-6 top-6 z-50 rounded-lg border px-4 py-2 text-sm shadow-lg ${
            toast.type === "success"
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
              : "border-destructive/50 bg-destructive/10 text-destructive"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Record Hand</h1>
          <p className="text-sm text-muted-foreground">
            Capture a full hand with players, board, and actions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDraft && <Badge variant="secondary">Draft saved</Badge>}
          <Button
            onClick={handleSave}
            disabled={!minimumRequirementsMet || isSaving || isHydrating}
          >
            {isSaving ? "Saving..." : "Save Hand"}
          </Button>
        </div>
      </div>

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

      <CardPickerModal
        isOpen={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelectCard={handleSelectCard}
        isCardUsed={isCardUsedForPicker}
      />
    </div>
  );
}
