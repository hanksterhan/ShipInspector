import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useHandReplayStore } from "@/stores/useHandReplayStore";
import { ReplayTable, ReplayControls } from "@/components/hand-replayer";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "@/assets/icons";

export default function HandReplayerPage() {
  const { handId } = useParams<{ handId: string }>();
  const hand = useHandReplayStore((s) => s.hand);
  const loadStatus = useHandReplayStore((s) => s.loadStatus);
  const loadError = useHandReplayStore((s) => s.loadError);
  const loadHand = useHandReplayStore((s) => s.loadHand);
  const dispose = useHandReplayStore((s) => s.dispose);

  useEffect(() => {
    if (handId) {
      loadHand(handId);
    }
    return () => {
      dispose();
    };
  }, [handId, loadHand, dispose]);

  if (!handId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-2xl font-bold">Hand Replayer</h1>
        <p className="text-muted-foreground">
          Select a hand from the Hand Library to replay it.
        </p>
        <Button variant="outline" asChild>
          <Link to="/hands/library">
            <ChevronLeft className="size-4" />
            Back to Library
          </Link>
        </Button>
      </div>
    );
  }

  if (loadStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <LoadingSpinner />
        <p className="text-sm text-muted-foreground">Loading hand...</p>
      </div>
    );
  }

  if (loadStatus === "error" || loadError) {
    return (
      <div role="alert" className="flex flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-2xl font-bold">Error loading hand</h1>
        <p className="text-destructive">{loadError ?? "Unknown error"}</p>
        <Button variant="outline" asChild>
          <Link to="/hands/library">
            <ChevronLeft className="size-4" />
            Back to Library
          </Link>
        </Button>
      </div>
    );
  }

  if (!hand) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-2xl font-bold">Hand not found</h1>
        <Button variant="outline" asChild>
          <Link to="/hands/library">
            <ChevronLeft className="size-4" />
            Back to Library
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/hands/library" className="flex items-center gap-1">
              <ChevronLeft className="size-4" />
              Back to Library
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">Hand Replayer</h1>
        </div>
      </div>

      <ReplayTable hand={hand} />
      <ReplayControls />
    </div>
  );
}
