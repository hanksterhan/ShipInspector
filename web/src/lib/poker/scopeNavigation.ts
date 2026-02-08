export type Scope =
  | { kind: "player"; playerIndex: number; cardIndex: 0 | 1 }
  | { kind: "board"; boardIndex: number };

interface ScopeNavigationParams {
  numPlayers: number;
  activePlayers: Set<number>;
  players: Array<[unknown, unknown]>;
  board: Array<unknown>;
}

/**
 * Find the next empty scope slot, starting from the given scope.
 * Skips inactive players. Returns the original scope if all slots are filled.
 */
export function nextScope(
  fromScope: Scope,
  params: ScopeNavigationParams,
): Scope {
  const { numPlayers, activePlayers, players, board } = params;

  const isSlotFilled = (scope: Scope): boolean => {
    if (scope.kind === "player") {
      return players[scope.playerIndex]?.[scope.cardIndex] !== null;
    }
    return board[scope.boardIndex] !== null;
  };

  const advance = (scope: Scope): Scope | null => {
    if (scope.kind === "player") {
      if (scope.cardIndex === 0) {
        return { kind: "player", playerIndex: scope.playerIndex, cardIndex: 1 };
      }
      if (scope.playerIndex < numPlayers - 1) {
        return {
          kind: "player",
          playerIndex: scope.playerIndex + 1,
          cardIndex: 0,
        };
      }
      return { kind: "board", boardIndex: 0 };
    }
    if (scope.boardIndex < 4) {
      return { kind: "board", boardIndex: scope.boardIndex + 1 };
    }
    return null;
  };

  let currentScope = advance(fromScope);
  const maxAttempts = numPlayers * 2 + 5;
  let attempts = 0;

  while (currentScope && attempts < maxAttempts) {
    // Skip inactive players
    if (
      currentScope.kind === "player" &&
      !activePlayers.has(currentScope.playerIndex)
    ) {
      if (currentScope.playerIndex < numPlayers - 1) {
        currentScope = {
          kind: "player",
          playerIndex: currentScope.playerIndex + 1,
          cardIndex: 0,
        };
      } else {
        currentScope = { kind: "board", boardIndex: 0 };
      }
      attempts++;
      continue;
    }

    if (!isSlotFilled(currentScope)) {
      return currentScope;
    }

    currentScope = advance(currentScope);
    attempts++;
  }

  return fromScope;
}
