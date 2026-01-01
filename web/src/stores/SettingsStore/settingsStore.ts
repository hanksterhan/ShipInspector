import { action, makeObservable, observable } from "mobx";

export class SettingsStore {
    @observable
    trayOpen: boolean = false;

    @observable
    cardSelectionMode:
        | "Suit - Rank Selection"
        | "Rank - Suit Selection"
        | "52 Cards" = "52 Cards";

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
    setCardSelectionMode(
        mode: "Suit - Rank Selection" | "Rank - Suit Selection" | "52 Cards"
    ) {
        this.cardSelectionMode = mode;
    }

    @action
    resetSettings() {
        this.setCardSelectionMode("52 Cards");
    }
}
