import { useMemo } from 'react';
import type { HandListItem } from '@/services/handService';
import { useHandLibraryFiltersStore } from '@/stores/useHandLibraryFiltersStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { XCircle } from '@/assets/icons';

interface FilterBarProps {
  hands: HandListItem[];
}

export function FilterBar({ hands }: FilterBarProps) {
  const dateStart = useHandLibraryFiltersStore((s) => s.dateStart);
  const dateEnd = useHandLibraryFiltersStore((s) => s.dateEnd);
  const stakes = useHandLibraryFiltersStore((s) => s.stakes);
  const tableSize = useHandLibraryFiltersStore((s) => s.tableSize);
  const heroCards = useHandLibraryFiltersStore((s) => s.heroCards);
  const setDateStart = useHandLibraryFiltersStore((s) => s.setDateStart);
  const setDateEnd = useHandLibraryFiltersStore((s) => s.setDateEnd);
  const setStakes = useHandLibraryFiltersStore((s) => s.setStakes);
  const setTableSize = useHandLibraryFiltersStore((s) => s.setTableSize);
  const setHeroCards = useHandLibraryFiltersStore((s) => s.setHeroCards);
  const clearFilters = useHandLibraryFiltersStore((s) => s.clearFilters);
  const hasActiveFilters = useHandLibraryFiltersStore(
    (s) => s.hasActiveFilters()
  );

  const uniqueStakes = useMemo(() => {
    const stakesSet = new Set<string>();
    hands.forEach((hand) => {
      stakesSet.add(`${hand.small_blind}/${hand.big_blind}`);
    });
    return Array.from(stakesSet).sort((a, b) => {
      const [sbA, bbA] = a.split('/').map(Number);
      const [sbB, bbB] = b.split('/').map(Number);
      return bbA - bbB || sbA - sbB;
    });
  }, [hands]);

  const tableSizeOptions = [2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date-start" className="text-xs">
            Start Date
          </Label>
          <Input
            id="date-start"
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="h-9 w-full sm:w-40"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date-end" className="text-xs">
            End Date
          </Label>
          <Input
            id="date-end"
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="h-9 w-full sm:w-40"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stakes" className="text-xs">
            Stakes
          </Label>
          <Select
            value={stakes}
            onValueChange={(value) => setStakes(value === 'all' ? '' : value)}
          >
            <SelectTrigger id="stakes" className="h-9 w-full sm:w-32">
              <SelectValue placeholder="All stakes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stakes</SelectItem>
              {uniqueStakes.map((stake) => (
                <SelectItem key={stake} value={stake}>
                  {stake}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="table-size" className="text-xs">
            Table Size
          </Label>
          <Select
            value={tableSize?.toString() || 'all'}
            onValueChange={(value) =>
              setTableSize(value === 'all' ? null : Number(value))
            }
          >
            <SelectTrigger id="table-size" className="h-9 w-full sm:w-28">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {tableSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}-max
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hero-cards" className="text-xs">
            Hero Cards
          </Label>
          <Input
            id="hero-cards"
            type="text"
            value={heroCards}
            onChange={(e) => setHeroCards(e.target.value)}
            placeholder="e.g., AKs, QQ"
            className="h-9 w-full sm:w-32"
          />
        </div>

        {hasActiveFilters && (
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9"
            >
              <XCircle className="size-4" />
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
