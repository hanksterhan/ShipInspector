import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HandLibraryList,
  HandLibraryGrid,
  FilterBar,
} from "@/components/hand-library";
import { Button } from "@/components/ui/button";
import { Plus, Grid3X3, List, FolderOpen } from "@/assets/icons";
import { useHandLibraryStore } from "@/stores";
import { useHandLibraryFiltersStore } from "@/stores/useHandLibraryFiltersStore";
import { filterAndSortHands } from "@/lib/handFilters";
import { cn } from "@/lib/utils";

export default function HandLibraryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fetchHands = useHandLibraryStore((s) => s.fetchHands);
  const allHands = useHandLibraryStore((s) => s.hands ?? []);
  const error = useHandLibraryStore((s) => s.error);
  const nextCursor = useHandLibraryStore((s) => s.nextCursor);
  const loadMore = useHandLibraryStore((s) => s.loadMore);
  const isLoading = useHandLibraryStore((s) => s.isLoading);

  const viewMode = useHandLibraryFiltersStore((s) => s.viewMode);
  const setViewMode = useHandLibraryFiltersStore((s) => s.setViewMode);
  const dateStart = useHandLibraryFiltersStore((s) => s.dateStart);
  const dateEnd = useHandLibraryFiltersStore((s) => s.dateEnd);
  const stakes = useHandLibraryFiltersStore((s) => s.stakes);
  const tableSize = useHandLibraryFiltersStore((s) => s.tableSize);
  const heroCards = useHandLibraryFiltersStore((s) => s.heroCards);
  const sortField = useHandLibraryFiltersStore((s) => s.sortField);
  const sortDirection = useHandLibraryFiltersStore((s) => s.sortDirection);
  const hasActiveFilters = useHandLibraryFiltersStore((s) =>
    s.hasActiveFilters(),
  );

  useEffect(() => {
    fetchHands();
  }, [fetchHands, location.key]);

  const filteredHands = useMemo(() => {
    return filterAndSortHands(allHands, {
      dateStart,
      dateEnd,
      stakes,
      tableSize,
      heroCards,
      sortField,
      sortDirection,
    });
  }, [
    allHands,
    dateStart,
    dateEnd,
    stakes,
    tableSize,
    heroCards,
    sortField,
    sortDirection,
  ]);

  const showEmptyState = !isLoading && !error && allHands.length === 0;

  return (
    <div className="flex-1 overflow-auto flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">Hand Library</h1>
        </div>
        <Button onClick={() => navigate("/hands/record")}>
          <Plus className="size-4" />
          Record New Hand
        </Button>
      </div>

      {!showEmptyState && !(error && allHands.length === 0) && (
        <>
          <FilterBar hands={allHands} />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredHands.length}{" "}
              {filteredHands.length === 1 ? "hand" : "hands"}
              {hasActiveFilters && " (filtered)"}
            </div>

            <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={cn(
                  "h-8 px-3",
                  viewMode === "list" && "bg-secondary",
                )}
              >
                <List className="size-4" />
                List
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "h-8 px-3",
                  viewMode === "grid" && "bg-secondary",
                )}
              >
                <Grid3X3 className="size-4" />
                Grid
              </Button>
            </div>
          </div>

          {viewMode === "list" ? (
            <HandLibraryList hands={filteredHands} />
          ) : (
            <HandLibraryGrid hands={filteredHands} />
          )}
        </>
      )}

      {error && (viewMode === "grid" || allHands.length === 0) && (
        <div role="alert" className="library-error">
          <span>{error}</span>
          <Button variant="outline" onClick={() => fetchHands()}>
            Retry
          </Button>
        </div>
      )}
      {isLoading && viewMode === "grid" && (
        <div role="status" className="text-sm text-muted-foreground">
          Loading hands…
        </div>
      )}
      {nextCursor && viewMode === "grid" && (
        <Button
          variant="outline"
          disabled={isLoading}
          onClick={() => loadMore()}
        >
          Load more hands
        </Button>
      )}
      {showEmptyState && (
        <div className="library-empty">
          <FolderOpen size={40} strokeWidth={1.2} />
          <h2>Your next hand starts here.</h2>
          <Button onClick={() => navigate("/hands/record")}>
            <Plus size={16} />
            Record your first hand
          </Button>
        </div>
      )}
    </div>
  );
}
