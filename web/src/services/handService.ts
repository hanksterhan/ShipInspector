import { httpClient } from "./fetch";
import { HandSaveRequest } from "@common/interfaces";

export interface HandListItem {
    id: string;
    table_size: number;
    button_seat: number;
    small_blind: number;
    big_blind: number;
    ante: number;
    board_flop_1: string | null;
    board_flop_2: string | null;
    board_flop_3: string | null;
    board_turn: string | null;
    board_river: string | null;
    created_at: number;
}

export interface HandListResponse {
    hands: HandListItem[];
    nextCursor: string | null;
}

export interface HandListParams {
    limit?: number;
    cursor?: string;
    minStakes?: number;
    maxStakes?: number;
    startDate?: number;
    endDate?: number;
}

export class HandService {
    async createHand(payload: HandSaveRequest): Promise<{ hand_id: string }> {
        const response = await httpClient.post("/hands", payload);
        return response as { hand_id: string };
    }

    async listHands(params: HandListParams): Promise<HandListResponse> {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                query.set(key, String(value));
            }
        });
        const suffix = query.toString() ? `?${query.toString()}` : "";
        const response = await httpClient.get(`/hands${suffix}`);
        return response as HandListResponse;
    }

    async deleteHand(handId: string): Promise<void> {
        await httpClient.delete(`/hands/${handId}`);
    }
}
