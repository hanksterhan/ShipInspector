import { action, makeObservable, observable } from "mobx";

export class MenuStore {
    constructor() {
        makeObservable(this);
    }

    @observable
    selectedPage: string = "poker-hands";

    @observable
    menuVisible: boolean = true;

    @action
    setSelectedPage(page: string) {
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
