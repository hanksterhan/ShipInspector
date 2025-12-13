import { Manager } from "./rosterInfoInterfaces";

export interface LeagueDetails {
    league_key: string;
    game_key: string;
    name: string;
    url: string;
    num_teams: number;
    scoring_type: string;
    teams: TeamDetails[];
}

export interface TeamDetails {
    team_key: string;
    name: string;
    url: string;
    team_logo_url: string;
    number_of_moves: number;
    draft_grade?: string;
    draft_recap_url?: string;
    manager: Manager;
}
