interface Manager {
    manager_id: string;
    nickname: string;
    image_url: string;
    felo_score: string;
    felo_tier: string;
}

export interface LeagueStandingsTeam {
    team_key: string;
    team_id: string;
    name: string;
    url: string;
    team_logo_url: string;
    number_of_moves: number;
    number_of_trades: number;
    points_for: number;
    points_against: number;
    rank: number;
    playoff_seed: string;
    wins: number;
    losses: number;
    ties: number;
    percentage: string;
    draft_grade?: string;
    draft_recap_url?: string;
    manager: Manager;
}

export interface LeagueStandings {
    league_key: string;
    name: string;
    url: string;
    num_teams: number;
    scoring_type: string;
    teams: LeagueStandingsTeam[];
}

export interface LeagueStandingsSimple {
    team_name: string;
    final_rank: number;
    playoff_seed: string;
    wins: number;
    losses: number;
    nickname: string;
}
