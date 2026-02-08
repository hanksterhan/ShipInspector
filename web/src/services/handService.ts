import { httpClient } from "./httpClient";
import type { HandSaveRequest, HandForPlayback } from "@common/interfaces";

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

class HandService {
  async createHand(payload: HandSaveRequest): Promise<{ hand_id: string }> {
    return httpClient.post("/hands", payload) as Promise<{
      hand_id: string;
    }>;
  }

  async getHand(handId: string): Promise<HandForPlayback> {
    return httpClient.get(`/hands/${handId}`) as Promise<HandForPlayback>;
  }

  async listHands(params: HandListParams): Promise<HandListResponse> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.set(key, String(value));
      }
    });
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return httpClient.get(`/hands${suffix}`) as Promise<HandListResponse>;
  }

  async deleteHand(handId: string): Promise<void> {
    await httpClient.delete(`/hands/${handId}`);
  }
}

export const handService = new HandService();
