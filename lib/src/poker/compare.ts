import { HandRank } from "@common/interfaces";

/**
 * Compare two hand ranks to determine which is better
 * @param a - First hand rank
 * @param b - Second hand rank
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareRanks(a: HandRank, b: HandRank): number {
    // First compare categories
    if (a.category > b.category) return 1;
    if (a.category < b.category) return -1;

    // Categories are equal, compare tiebreakers
    for (
        let i = 0;
        i < Math.max(a.tiebreak.length, b.tiebreak.length);
        i++
    ) {
        const aRank = a.tiebreak[i] ?? 0;
        const bRank = b.tiebreak[i] ?? 0;

        if (aRank > bRank) return 1;
        if (aRank < bRank) return -1;
    }

    // Hands are equal
    return 0;
}
