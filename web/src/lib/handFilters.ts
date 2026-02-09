import type { HandListItem } from '@/services/handService';
import type { SortField, SortDirection } from '@/stores/useHandLibraryFiltersStore';

interface FilterOptions {
  dateStart: string;
  dateEnd: string;
  stakes: string;
  tableSize: number | null;
  heroCards: string;
  sortField: SortField;
  sortDirection: SortDirection;
}

export function filterAndSortHands(
  hands: HandListItem[],
  options: FilterOptions
): HandListItem[] {
  let filtered = [...hands];

  if (options.dateStart) {
    const startDate = new Date(options.dateStart).getTime();
    filtered = filtered.filter((hand) => hand.created_at >= startDate);
  }

  if (options.dateEnd) {
    const endDate = new Date(options.dateEnd).getTime();
    const endOfDay = endDate + 24 * 60 * 60 * 1000 - 1;
    filtered = filtered.filter((hand) => hand.created_at <= endOfDay);
  }

  if (options.stakes) {
    filtered = filtered.filter((hand) => {
      const handStakes = `${hand.small_blind}/${hand.big_blind}`;
      return handStakes === options.stakes;
    });
  }

  if (options.tableSize !== null) {
    filtered = filtered.filter((hand) => hand.table_size === options.tableSize);
  }

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;

    switch (options.sortField) {
      case 'date':
        comparison = a.created_at - b.created_at;
        break;
      case 'stakes': {
        const bbA = a.big_blind;
        const bbB = b.big_blind;
        comparison = bbA - bbB;
        if (comparison === 0) {
          comparison = a.small_blind - b.small_blind;
        }
        break;
      }
      case 'tableSize':
        comparison = a.table_size - b.table_size;
        break;
    }

    return options.sortDirection === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
