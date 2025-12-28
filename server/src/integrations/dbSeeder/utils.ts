import sql from "../../config/database";

export function createValuesString(numVars: number): string {
    return Array(numVars).fill("?").join(", ");
}

export async function getAllLeagueIds(): Promise<string[]> {
    const data = await sql`SELECT league_id FROM leagues`;

    const leagueIds = data.map((league: any) => {
        return league.league_id;
    });

    return leagueIds;
}
