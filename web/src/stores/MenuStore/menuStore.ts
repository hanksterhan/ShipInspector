import { action, makeObservable, observable } from "mobx";

export type AppPages = "poker-hands" | "odds-calculator";
export class MenuStore {
    constructor() {
        makeObservable(this);
    }

    @observable
    selectedPage: AppPages = "poker-hands";

    @action
    setSelectedPage(page: AppPages) {
        this.selectedPage = page;
    }

    get getSelectedPage() {
        return this.selectedPage;
    }
}
