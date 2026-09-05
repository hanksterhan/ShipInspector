import { useEquityCalculatorStore } from "@/stores";
import { PlayingCard } from "./PlayingCard";

export function BoardCards() {
  const {
    board,
    scope,
    pickerOpen,
    setScope,
    openPicker,
    clearCard,
    boardCardsUsedInWinningHand,
  } = useEquityCalculatorStore();
  return (
    <div className="community-board">
      {[
        { name: "Flop", indices: [0, 1, 2] },
        { name: "Turn", indices: [3] },
        { name: "River", indices: [4] },
      ].map((group) => (
        <div className="board-group" key={group.name}>
          <span className="board-label">{group.name}</span>
          <div className="board-group-cards">
            {group.indices.map((index) => (
              <PlayingCard
                key={index}
                card={board[index]}
                label={`Board card ${index + 1}`}
                selected={
                  pickerOpen &&
                  scope.kind === "board" &&
                  scope.boardIndex === index
                }
                winning={boardCardsUsedInWinningHand.has(index)}
                disabled={
                  index >= 3 && board.slice(0, index).some((c) => c === null)
                }
                onSelect={() => {
                  setScope({ kind: "board", boardIndex: index });
                  openPicker();
                }}
                onClear={() => clearCard({ kind: "board", boardIndex: index })}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
