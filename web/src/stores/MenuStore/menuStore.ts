import { action, makeObservable, observable } from "mobx";

export type AppPages = "equity-calculator" | "poker-hands";
export class MenuStore {
    constructor() {
        makeObservable(this);
    }

    @observable
    selectedPage: AppPages = "equity-calculator";

    @action
    setSelectedPage(page: AppPages) {
        this.selectedPage = page;
    }

    get getSelectedPage() {
        return this.selectedPage;
    }
}
