import { action, makeObservable, observable } from "mobx";

export class SettingsStore {
    @observable
    trayOpen: boolean = false;

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
}
