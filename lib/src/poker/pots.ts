export interface PotContributor {
  seat: number;
  committed: number;
  eligible: boolean;
}
export function potLayers(players: readonly PotContributor[]): { amount: number; eligible: number[] }[] {
  const levels = [...new Set(players.map(p => p.committed).filter(n => n > 0))].sort((a, b) => a - b);
  let previous = 0;
  return levels.map(level => {
    const contributors = players.filter(p => p.committed >= level);
    const amount = (level - previous) * contributors.length;
    previous = level;
    return { amount, eligible: contributors.filter(p => p.eligible).map(p => p.seat) };
  });
}
