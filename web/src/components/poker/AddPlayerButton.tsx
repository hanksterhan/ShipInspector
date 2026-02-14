import { useEquityCalculatorStore } from "@/stores";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus } from "@/assets/icons";

interface AddPlayerButtonProps {
  playerIndex: number;
}

export function AddPlayerButton({ playerIndex }: AddPlayerButtonProps) {
  const addPlayer = useEquityCalculatorStore((s) => s.addPlayer);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => addPlayer(playerIndex)}
            className="size-7 md:size-8 xl:size-9 text-muted-foreground hover:text-foreground"
            aria-label={`Add Player ${playerIndex + 1}`}
          >
            <Plus className="size-4 md:size-5 xl:size-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add Player</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
