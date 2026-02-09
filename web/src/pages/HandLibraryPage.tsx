import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HandLibraryList } from "@/components/hand-library";
import { Button } from "@/components/ui/button";
import { Plus } from "@/assets/icons";
import { useHandLibraryStore } from "@/stores";

export default function HandLibraryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fetchHands = useHandLibraryStore((s) => s.fetchHands);

  useEffect(() => {
    fetchHands();
  }, [fetchHands, location.key]);

  return (
    <div className="flex-1 overflow-auto flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">Hand Library</h1>
          <p className="text-sm text-muted-foreground">
            Browse, replay, and manage your saved hands.
          </p>
        </div>
        <Button onClick={() => navigate("/hands/record")}>
          <Plus className="size-4" />
          Record New Hand
        </Button>
      </div>
      <HandLibraryList />
    </div>
  );
}
