/**
 * Calculate poker position labels based on button seat and table size.
 *
 * Position order clockwise from button:
 * BTN -> SB -> BB -> UTG -> UTG+1 -> MP -> MP+1 -> HJ -> CO
 *
 * For smaller tables, positions collapse from early positions:
 * - 2 players: BTN/SB, BB
 * - 3 players: BTN, SB, BB
 * - 4 players: BTN, SB, BB, UTG
 * - 5 players: BTN, SB, BB, UTG, CO
 * - 6 players: BTN, SB, BB, UTG, MP, CO
 * - 7 players: BTN, SB, BB, UTG, MP, HJ, CO
 * - 8 players: BTN, SB, BB, UTG, UTG+1, MP, HJ, CO
 * - 9 players: BTN, SB, BB, UTG, UTG+1, MP, MP+1, HJ, CO
 */
export type PositionLabel =
  | 'BTN'
  | 'SB'
  | 'BB'
  | 'UTG'
  | 'UTG+1'
  | 'MP'
  | 'MP+1'
  | 'HJ'
  | 'CO';

export function getPositionLabel(
  seatIndex: number,
  buttonSeat: number,
  tableSize: number,
): PositionLabel | null {
  if (seatIndex < 0 || seatIndex >= tableSize) return null;

  const offset = (seatIndex - buttonSeat + tableSize) % tableSize;

  if (tableSize === 2) {
    return offset === 0 ? 'BTN' : 'BB';
  }

  if (offset === 0) return 'BTN';
  if (offset === 1) return 'SB';
  if (offset === 2) return 'BB';

  const remainingSeats = tableSize - 3;
  const positionFromBB = offset - 2;

  const POSITION_MAP: Record<number, PositionLabel[]> = {
    1: ['UTG'],
    2: ['UTG', 'CO'],
    3: ['UTG', 'MP', 'CO'],
    4: ['UTG', 'MP', 'HJ', 'CO'],
    5: ['UTG', 'UTG+1', 'MP', 'HJ', 'CO'],
    6: ['UTG', 'UTG+1', 'MP', 'MP+1', 'HJ', 'CO'],
  };

  const labels = POSITION_MAP[remainingSeats];
  if (!labels || positionFromBB < 1 || positionFromBB > labels.length)
    return null;

  return labels[positionFromBB - 1];
}

/**
 * Get all position labels for a table configuration.
 * Returns a Map of seatIndex -> PositionLabel
 */
export function getTablePositions(
  buttonSeat: number,
  tableSize: number,
): Map<number, PositionLabel> {
  const positions = new Map<number, PositionLabel>();
  for (let i = 0; i < tableSize; i++) {
    const label = getPositionLabel(i, buttonSeat, tableSize);
    if (label) positions.set(i, label);
  }
  return positions;
}
