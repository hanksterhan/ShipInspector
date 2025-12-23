import { action, makeObservable, observable } from "mobx";

export type AppPages = "invite-management";
export class MenuStore {
    constructor() {
        makeObservable(this);
    }

    @observable
    selectedPage: AppPages = "invite-management";

    @action
    setSelectedPage(page: AppPages) {
        this.selectedPage = page;
    }

    get getSelectedPage() {
        return this.selectedPage;
    }
}
