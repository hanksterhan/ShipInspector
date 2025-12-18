import { action, makeObservable, observable } from "mobx";

export class SettingsStore {
    @observable
    trayOpen: boolean = false;

    // Default number of players is 2 (heads up)
    @observable
    players: number = 2;

    @observable
    cardSelectionMode: "Suit - Rank Selection" | "52 Cards" = "52 Cards";

    @observable
    equityCalculationMode: "Monte Carlo" | "Exact" | "Both" = "Exact";

    constructor() {
        makeObservable(this);
    }

    @action
    toggleTray() {
        this.trayOpen = !this.trayOpen;
    }

    @action
    setTrayOpen(open: boolean) {
        this.trayOpen = open;
    }

    @action
    setPlayers(players: number) {
        this.players = players;
    }

    @action
    setCardSelectionMode(mode: "Suit - Rank Selection" | "52 Cards") {
        this.cardSelectionMode = mode;
    }

    @action
    setEquityCalculationMode(
        mode: "Monte Carlo" | "Exact" | "Both"
    ) {
        this.equityCalculationMode = mode;
    }

    @action
    resetSettings() {
        this.setPlayers(2);
        this.setCardSelectionMode("52 Cards");
        this.setEquityCalculationMode("Exact");
    }
}
