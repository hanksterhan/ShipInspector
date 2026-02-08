import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CardRank, CardSuit } from "@common/interfaces";
import { SUIT_MAP, getRankLabel } from "@/lib/poker";
import { cn } from "@/lib/utils";
import { useHandLibraryStore } from "@/stores";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Play, Trash2 } from "@/assets/icons";

interface BoardCardPreviewProps {
  card: string;
}

function BoardCardPreview({ card }: BoardCardPreviewProps) {
  const suit = card.slice(-1) as CardSuit;
  const rankToken = card.slice(0, -1);
  const rankValue = Number(rankToken);
  const rankLabel = Number.isNaN(rankValue)
    ? rankToken
    : getRankLabel(rankValue as CardRank);
  const suitData = SUIT_MAP[suit];

  if (!suitData) {
    return (
      <span className="rounded border border-border/70 px-1.5 py-0.5 text-xs">
        {card}
      </span>
    );
  }

  const Icon = suitData.Icon;

  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded border border-border/70 px-1.5 py-0.5 text-xs font-semibold",
        suitData.isDark && "card-suit-dark",
      )}
      style={{ color: suitData.color }}
    >
      <span>{rankLabel}</span>
      <Icon className="size-3" />
    </span>
  );
}

function BoardPreview({ cards }: { cards: Array<string | null> }) {
  const visibleCards = useMemo(
    () => cards.filter((card): card is string => Boolean(card)),
    [cards],
  );

  if (visibleCards.length === 0) {
    return <span className="text-xs text-muted-foreground">No board</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {visibleCards.map((card, index) => (
        <BoardCardPreview key={`${card}-${index}`} card={card} />
      ))}
    </div>
  );
}

function HandLibrarySkeleton() {
  return (
    <div className="space-y-3">
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

export function HandLibraryList() {
  const navigate = useNavigate();
  const hands = useHandLibraryStore((s) => s.hands ?? []);
  const nextCursor = useHandLibraryStore((s) => s.nextCursor);
  const isLoading = useHandLibraryStore((s) => s.isLoading);
  const error = useHandLibraryStore((s) => s.error);
  const selectedHandId = useHandLibraryStore((s) => s.selectedHandId);
  const setSelectedHandId = useHandLibraryStore((s) => s.setSelectedHandId);
  const fetchHands = useHandLibraryStore((s) => s.fetchHands);
  const loadMore = useHandLibraryStore((s) => s.loadMore);
  const deleteHand = useHandLibraryStore((s) => s.deleteHand);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const deleteTarget = hands.find((hand) => hand.id === deleteTargetId) || null;

  if (isLoading && hands.length === 0) {
    return <HandLibrarySkeleton />;
  }

  if (error && hands.length === 0) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
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
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {hands.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No hands saved yet. Record a hand to see it here.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Stakes</TableHead>
                <TableHead>Table Size</TableHead>
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
