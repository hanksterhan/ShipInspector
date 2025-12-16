import { action, makeObservable, observable } from "mobx";

export type AppPages = "equity-calculator" | "poker-hands";
export class MenuStore {
    constructor() {
        makeObservable(this);
    }

    @observable
    selectedPage: AppPages = "equity-calculator";

    @observable
    menuVisible: boolean = true;

    @action
    setSelectedPage(page: AppPages) {
        this.selectedPage = page;
    }

    @action
    setMenuVisible(visible: boolean) {
        this.menuVisible = visible;
    }

    @action
    toggleMenuVisible() {
        this.menuVisible = !this.menuVisible;
    }

    get getSelectedPage() {
        return this.selectedPage;
    }
}
