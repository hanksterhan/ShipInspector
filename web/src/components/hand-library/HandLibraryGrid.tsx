import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { HandListItem } from '@/services/handService';
import { useHandLibraryStore } from '@/stores';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Play, Trash2 } from '@/assets/icons';
import { BoardPreview } from './BoardPreview';

interface HandLibraryGridProps {
  hands: HandListItem[];
}

export function HandLibraryGrid({ hands }: HandLibraryGridProps) {
  const navigate = useNavigate();
  const setSelectedHandId = useHandLibraryStore((s) => s.setSelectedHandId);
  const deleteHand = useHandLibraryStore((s) => s.deleteHand);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const deleteTarget = hands.find((hand) => hand.id === deleteTargetId) || null;

  if (hands.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <Card
              key={hand.id}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => {
                setSelectedHandId(hand.id);
                navigate(`/hands/replay/${hand.id}`);
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {handDate.toLocaleDateString()}
                </CardTitle>
                <CardDescription>
                  {hand.small_blind}/{hand.big_blind} · {hand.table_size}-max
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Board</span>
                  <BoardPreview cards={boardCards} />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-1 pt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedHandId(hand.id);
                    navigate(`/hands/replay/${hand.id}`);
                  }}
                  aria-label="Replay hand"
                >
                  <Play className="size-4" />
                  Replay
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    setDeleteTargetId(hand.id);
                  }}
                  aria-label="Delete hand"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

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
              This removes the hand from your library. You can't undo this action.
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
    </>
  );
}
