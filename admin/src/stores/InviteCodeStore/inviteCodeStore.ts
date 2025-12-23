import { makeObservable, observable, action, runInAction } from "mobx";
import {
    inviteCodeService,
    InviteCode,
    GetAllInviteCodesResponse,
} from "../../services/inviteCodeService";

export class InviteCodeStore {
    @observable
    inviteCodes: InviteCode[] = [];

    @observable
    isLoading = false;

    @observable
    error: string | null = null;

    @observable
    total: number = 0;

    @observable
    used: number = 0;

    @observable
    unused: number = 0;

    constructor() {
        makeObservable(this);
    }

    @action
    async fetchInviteCodes(): Promise<void> {
        this.isLoading = true;
        this.error = null;
        try {
            const response: GetAllInviteCodesResponse =
                await inviteCodeService.getAllInviteCodes();
            runInAction(() => {
                this.inviteCodes = response.inviteCodes;
                this.total = response.total;
                this.used = response.used;
                this.unused = response.unused;
                this.isLoading = false;
            });
        } catch (error: any) {
            runInAction(() => {
                this.error = error.message || "Failed to fetch invite codes";
                this.isLoading = false;
            });
            throw error;
        }
    }

    @action
    async createInviteCode(): Promise<string> {
        this.isLoading = true;
        this.error = null;
        try {
            const response = await inviteCodeService.createInviteCode();
            // Refresh the list after creating
            await this.fetchInviteCodes();
            return response.code;
        } catch (error: any) {
            runInAction(() => {
                this.error = error.message || "Failed to create invite code";
                this.isLoading = false;
            });
            throw error;
        }
    }

    @action
    async deleteInviteCode(code: string): Promise<void> {
        this.isLoading = true;
        this.error = null;
        try {
            await inviteCodeService.deleteInviteCode(code);
            // Refresh the list after deleting
            await this.fetchInviteCodes();
        } catch (error: any) {
            runInAction(() => {
                this.error = error.message || "Failed to delete invite code";
                this.isLoading = false;
            });
            throw error;
        }
    }

    @action
    clearError(): void {
        this.error = null;
    }
}
