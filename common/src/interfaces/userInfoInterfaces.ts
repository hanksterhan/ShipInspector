export interface PlayerLeagues {
    player_league_id: string;
    sport: string;
    season: string;
}

export interface LeagueInfo {
    league_id: string;
    name: string;
    num_teams: number;
    scoring_type: string;
    sport: string;
    season: string;
}

export interface UserLeaguesResponse {
    fantasy_content: {
        "xml:lang": string;
        "yahoo:uri": string;
        users: {
            [key: string]: User | number;
        };
        time: string;
        copyright: string;
        refresh_rate: string;
    };
}

export interface User {
    user: [
        {
            guid: string;
        },
        {
            games: {
                [key: string]: Game | number;
            };
        }
    ];
}

export interface Game {
    game: (GameDetails | Leagues)[];
}

export interface GameDetails {
    game_key: string;
    game_id: string;
    name: string;
    code: string;
    type: string;
    url: string;
    season: string;
    is_registration_over: number;
    is_game_over: number;
    is_offseason: number;
    editorial_season?: string;
    picks_status?: string;
    contest_group_id?: string;
    scenario_generator?: number;
    current_week?: string;
    is_contest_reg_active?: number;
    is_contest_over?: number;
    has_schedule?: number;
    contests?: {
        [key: string]: string;
    };
    is_locked?: number;
    is_live_draft_lobby_active?: number;
}

export interface Leagues {
    leagues: {
        [key: string]: LeagueWrapper | number;
    };
}

export interface LeagueWrapper {
    league: League[];
}

export interface League {
    league_key: string;
    name: string;
    num_teams: number;
    scoring_type: string;
    game_code: string;
    season: string;
}
