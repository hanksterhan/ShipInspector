export interface Team {
    team_key: string;
    name: string;
    draft_grade?: string;
    draft_recap_url?: string;
    manager: Manager;
}
export interface TeamRoster extends Team {
    players: Player[];
}

export interface Manager {
    nickname: string;
    image_url: string;
}

export interface Player {
    player_key: string;
    full_name: string;
    editorial_team_full_name: string;
    editorial_team_abbr: string;
    bye_weeks: string;
    is_keeper: Keeper;
    uniform_number: string;
    headshot_url: string;
    primary_position: string;
}

interface Keeper {
    status: boolean;
    cost: boolean;
    kept: boolean;
}
