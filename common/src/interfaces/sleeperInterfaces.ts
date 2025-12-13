export interface SleeperUserDetails {
    display_name: string;
    user_id: string;
    username: string;
}

export interface SleeperUserIdResponse {
    avatar: string | null;
    cookies: any | null;
    created: any | null;
    currencies: any | null;
    data_updated: any | null;
    deleted: any | null;
    display_name: string | null;
    email: string | null;
    is_bot: boolean;
    metadata: any | null;
    notifications: any | null;
    pending: any | null;
    phone: string | null;
    real_name: string | null;
    solicitable: any | null;
    summoner_name: string | null;
    summoner_region: string | null;
    token: string | null;
    user_id: string;
    username: string;
    verification: any | null;
}

export interface SleeperLeagueDetails {
    name: string;
    num_playoff_teams: number;
    num_teams: number;
    ppr: number;
    league_id: string;
    roster_positions: string[];
}

export interface SleeperLeagueDetailsResponse {
    name: string;
    status: string;
    metadata: {
        auto_continue: string;
        keeper_deadline: string;
        latest_league_winner_roster_id?: string; // optional, only in some responses
    };
    settings: {
        best_ball: number;
        waiver_budget: number;
        disable_adds: number;
        capacity_override: number;
        waiver_bid_min: number;
        taxi_deadline: number;
        draft_rounds: number;
        reserve_allow_na: number;
        start_week: number;
        playoff_seed_type: number;
        playoff_teams: number;
        veto_votes_needed: number;
        num_teams: number;
        daily_waivers_hour: number;
        playoff_type: number;
        taxi_slots: number;
        daily_waivers_days: number;
        playoff_week_start: number;
        waiver_clear_days: number;
        reserve_allow_doubtful: number;
        commissioner_direct_invite: number;
        veto_auto_poll: number;
        reserve_allow_dnr: number;
        taxi_allow_vets: number;
        waiver_day_of_week: number;
        playoff_round_type: number;
        reserve_allow_out: number;
        reserve_allow_sus: number;
        veto_show_votes: number;
        trade_deadline: number;
        taxi_years: number;
        daily_waivers: number;
        disable_trades: number;
        pick_trading: number;
        type: number;
        max_keepers: number;
        waiver_type: number;
        max_subs: number;
        league_average_match: number;
        trade_review_days: number;
        bench_lock: number;
        offseason_adds: number;
        leg: number;
        reserve_slots: number;
        reserve_allow_cov: number;
        daily_waivers_last_ran: number;
    };
    avatar: string | null;
    company_id: string | null;
    scoring_settings: {
        sack: number;
        fgm_40_49: number;
        fgm_yds?: number; // optional, not present in all responses
        pass_int: number;
        pts_allow_0: number;
        pass_2pt: number;
        st_td: number;
        rec_td: number;
        fgm_30_39: number;
        xpmiss: number;
        rush_td: number;
        rec_2pt: number;
        st_fum_rec: number;
        fgmiss: number;
        ff: number;
        rec: number;
        pts_allow_14_20: number;
        fgm_0_19: number;
        int: number;
        def_st_fum_rec: number;
        fum_lost: number;
        pts_allow_1_6: number;
        fgm_20_29: number;
        pts_allow_21_27: number;
        xpm: number;
        rush_2pt: number;
        fum_rec: number;
        def_st_td: number;
        fgm_50p: number;
        def_td: number;
        rec_td_40p?: number;
        safe: number;
        pass_yd: number;
        blk_kick: number;
        pass_td: number;
        rush_yd: number;
        fum: number;
        pts_allow_28_34: number;
        pts_allow_35p: number;
        fum_rec_td: number;
        rec_yd: number;
        rush_td_40p?: number;
        def_st_ff: number;
        pts_allow_7_13: number;
        st_ff: number;
    };
    season: string;
    season_type: string;
    shard: number;
    sport: string;
    display_order: number;
    last_message_id: string;
    draft_id: string;
    last_author_avatar: string | null;
    last_author_display_name: string;
    last_author_id: string;
    last_author_is_bot: boolean;
    last_message_attachment: string | null;
    last_message_text_map: Record<string, string> | null;
    last_message_time: number;
    last_pinned_message_id: string | null;
    last_read_id: string;
    league_id: string;
    previous_league_id: string | null;
    bracket_id: string | null;
    group_id: string | null;
    loser_bracket_id: string | null;
    roster_positions: string[];
    total_rosters: number;
    last_transaction_id: string | null;
}

export interface SleeperLeagueUser {
    avatar: string;
    team_name: string;
    league_id: string;
    user_id: string;
}

export interface SleeperLeagueUserResponse {
    avatar: string;
    display_name: string;
    is_bot: boolean;
    is_owner: boolean | null;
    league_id: string;
    metadata: SleeperLeagueUserMetadata;
    settings: null;
    user_id: string;
}

// Define the Metadata interface with potential properties
export interface SleeperLeagueUserMetadata {
    allow_pn?: string;
    mention_pn?: string;
    team_name?: string;
    allow_sms?: string;
    league_report_pn?: string;
    mascot_message?: string;
    player_nickname_update?: string;
    team_name_update?: string;
    trade_block_pn?: string;
    transaction_commissioner?: string;
    transaction_free_agent?: string;
    transaction_trade?: string;
    transaction_waiver?: string;
    user_message_pn?: string;
    avatar?: string; // Optional avatar override within metadata
}

export interface SleeperRoster {
    league_id: string;
    owner_id: string;
    roster_id: number;
    players: string[];
    starters: string[];
    wins: number;
    losses: number;
    total_moves: number;
    waiver_budget_used: number;
}

export interface SleeperLeagueRostersResponse {
    co_owners: string[] | null;
    keepers: any | null;
    league_id: string;
    metadata: {
        record: string;
        streak: string;
        allow_pn_inactive_starters?: string;
        allow_pn_player_injury_status?: string;
        allow_pn_scoring?: string;
        restrict_pn_scoring_starters_only?: string;
    };
    owner_id: string;
    player_map: any | null;
    players: string[];
    reserve: string[] | null;
    roster_id: number;
    settings: {
        fpts: number;
        fpts_against: number;
        fpts_against_decimal: number;
        fpts_decimal: number;
        losses: number;
        ppts: number;
        ppts_decimal: number;
        ties: number;
        total_moves: number;
        waiver_budget_used: number;
        waiver_position: number;
        wins: number;
    };
    starters: string[];
    taxi: any | null;
}

export interface SleeperNflStateResponse {
    week: number;
    season_type: string;
    season: string;
    leg: number;
    league_season: string;
    previous_season: string;
    season_start_date: string;
    display_week: number;
    league_create_season: string;
    season_has_scores: boolean;
}

export interface SleeperMatchupResponse {
    points: number;
    players: string[];
    roster_id: number;
    custom_points: number | null;
    matchup_id: number;
    starters: string[];
    starters_points: number[];
    players_points: { [key: string]: number }; // player_id: points
}

export interface SleeperPlayerResponse {
    practice_description: string | null;
    swish_id: number | null;
    full_name: string;
    age: number | null;
    hashtag: string;
    espn_id: number | null;
    weight: string;
    birth_city: string | null;
    search_last_name: string;
    height: string;
    depth_chart_position: string | null;
    rotoworld_id: number | null;
    depth_chart_order: number | null;
    number: number;
    metadata: {
        channel_id: string;
    };
    active: boolean;
    injury_status: string | null;
    fantasy_data_id: number | null;
    fantasy_positions: string[]; // Array of positions
    birth_state: string | null;
    last_name: string;
    search_full_name: string;
    search_rank: number;
    news_updated: number | null;
    status: string;
    competitions: any[]; // Could be an array of competition objects, but keeping it as any[] for now
    sport: string;
    team_changed_at: number | null;
    practice_participation: string | null;
    birth_date: string | null;
    first_name: string;
    sportradar_id: string | null;
    injury_notes: string | null;
    team_abbr: string | null;
    injury_start_date: string | null;
    opta_id: string | null;
    college: string;
    years_exp: number;
    injury_body_part: string | null;
    rotowire_id: number | null;
    birth_country: string | null;
    position: string;
    oddsjam_id: string | null;
    stats_id: number | null;
    high_school: string;
    yahoo_id: number | null;
    search_first_name: string;
    gsis_id: string | null;
    pandascore_id: string | null;
    player_id: string;
    team: string | null;
}

export interface SleeperPlayerMapResponse {
    [key: string]: SleeperPlayerResponse; // Maps player IDs to player data
}

export interface SleeperPlayer {
    player_id: string;
    full_name: string;
    age: number | null;
    number: number | null;
    team: string | null;
    fantasy_positions: string | null;
    espn_id: number | null;
    yahoo_id: number | null;
    years_exp: number | null;
    college: string | null;
}

export interface SleeperPlayerWithStats extends SleeperPlayer {
    isStarter: boolean;
    rosterPosition: string;
    points: number;
}

export interface SleeperTeamWithStats {
    league_id: string;
    league_name: string;
    owner_id: string;
    roster_id: number;
    team_name: string;
    matchup_id: number;
    wins: number;
    losses: number;
    total_moves: number;
    waiver_budget_used: number;
    points: number;
    players: SleeperPlayerWithStats[];
}
