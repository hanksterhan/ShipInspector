import { httpClient } from "./fetch";

export interface InviteCode {
    code: string;
    used: boolean;
    usedByEmail?: string;
    usedAt?: number;
    createdAt: number;
    createdBy?: string;
}

export interface GetAllInviteCodesResponse {
    inviteCodes: InviteCode[];
    total: number;
    used: number;
    unused: number;
}

const INVITE_CODE_ENDPOINTS = {
    getAll: "/invite-codes",
    create: "/invite-codes",
    delete: (code: string) => `/invite-codes/${code}`,
};

export class InviteCodeService {
    async getAllInviteCodes(): Promise<GetAllInviteCodesResponse> {
        const response = await httpClient.get(INVITE_CODE_ENDPOINTS.getAll);
        return response as GetAllInviteCodesResponse;
    }

    async createInviteCode(): Promise<{ code: string; message: string }> {
        const response = await httpClient.post(
            INVITE_CODE_ENDPOINTS.create,
            {}
        );
        return response;
    }

    async deleteInviteCode(code: string): Promise<void> {
        await httpClient.delete(INVITE_CODE_ENDPOINTS.delete(code));
    }
}

export const inviteCodeService = new InviteCodeService();
