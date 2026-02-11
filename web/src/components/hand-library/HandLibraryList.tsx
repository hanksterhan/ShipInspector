import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { HandListItem } from '@/services/handService';
import { useHandLibraryStore } from '@/stores';
import { useHandLibraryFiltersStore } from '@/stores/useHandLibraryFiltersStore';
import type { SortField } from '@/stores/useHandLibraryFiltersStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Play, Trash2, ArrowUp, ArrowDown } from '@/assets/icons';
import { BoardPreview } from './BoardPreview';

interface SortableHeaderProps {
  field: SortField;
  label: string;
  currentField: SortField;
  currentDirection: 'asc' | 'desc';
  onToggle: (field: SortField) => void;
}

function SortableHeader({
  field,
  label,
  currentField,
  currentDirection,
  onToggle,
}: SortableHeaderProps) {
  const isActive = currentField === field;

  return (
    <TableHead>
      <button
        onClick={() => onToggle(field)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        {isActive && (
          currentDirection === 'asc' ? (
            <ArrowUp className="size-3.5" />
          ) : (
            <ArrowDown className="size-3.5" />
          )
        )}
      </button>
    </TableHead>
  );
}

function HandLibrarySkeleton() {
  return (
    <div role="status" aria-label="Loading hands" className="space-y-3">
      <div className="h-8 w-48 rounded bg-muted/40" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={`skeleton-row-${index}`}
            className="h-10 w-full animate-pulse rounded bg-muted/40"
          />
        ))}
      </div>
    </div>
  );
}

interface HandLibraryListProps {
  hands: HandListItem[];
}

export function HandLibraryList({ hands }: HandLibraryListProps) {
  const navigate = useNavigate();
  const nextCursor = useHandLibraryStore((s) => s.nextCursor);
  const isLoading = useHandLibraryStore((s) => s.isLoading);
  const error = useHandLibraryStore((s) => s.error);
  const selectedHandId = useHandLibraryStore((s) => s.selectedHandId);
  const setSelectedHandId = useHandLibraryStore((s) => s.setSelectedHandId);
  const fetchHands = useHandLibraryStore((s) => s.fetchHands);
  const loadMore = useHandLibraryStore((s) => s.loadMore);
  const deleteHand = useHandLibraryStore((s) => s.deleteHand);

  const sortField = useHandLibraryFiltersStore((s) => s.sortField);
  const sortDirection = useHandLibraryFiltersStore((s) => s.sortDirection);
  const toggleSort = useHandLibraryFiltersStore((s) => s.toggleSort);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const deleteTarget = hands.find((hand) => hand.id === deleteTargetId) || null;

  if (isLoading && hands.length === 0) {
    return <HandLibrarySkeleton />;
  }

  if (error && hands.length === 0) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
        <div className="text-sm text-destructive">{error}</div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => fetchHands()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {hands.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No hands match your filters.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader
                  field="date"
                  label="Date"
                  currentField={sortField}
                  currentDirection={sortDirection}
                  onToggle={toggleSort}
                />
                <SortableHeader
                  field="stakes"
                  label="Stakes"
                  currentField={sortField}
                  currentDirection={sortDirection}
                  onToggle={toggleSort}
                />
                <SortableHeader
                  field="tableSize"
                  label="Table Size"
                  currentField={sortField}
                  currentDirection={sortDirection}
                  onToggle={toggleSort}
                />
                <TableHead>Board</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hands.map((hand) => {
                const handDate = new Date(hand.created_at);
                const boardCards = [
                  hand.board_flop_1,
                  hand.board_flop_2,
                  hand.board_flop_3,
                  hand.board_turn,
                  hand.board_river,
                ];

                return (
                  <TableRow
                    key={hand.id}
                    data-state={hand.id === selectedHandId ? "selected" : undefined}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedHandId(hand.id);
                      navigate(`/hands/replay/${hand.id}`);
                    }}
                  >
                    <TableCell className="font-medium">
                      {handDate.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {hand.small_blind}/{hand.big_blind}
                    </TableCell>
                    <TableCell>{hand.table_size}</TableCell>
                    <TableCell>
                      <BoardPreview cards={boardCards} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedHandId(hand.id);
                            navigate(`/hands/replay/${hand.id}`);
                          }}
                          aria-label="Replay hand"
                        >
                          <Play className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteTargetId(hand.id);
                          }}
                          aria-label="Delete hand"
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {hands.length > 0 && nextCursor && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadMore()}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="size-3.5 animate-spin" />}
            {isLoading ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}

      <Dialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTargetId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete hand?</DialogTitle>
            <DialogDescription>
              This removes the hand from your library. You can’t undo this action.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTargetId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) {
                  deleteHand(deleteTarget.id);
                }
                setDeleteTargetId(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
