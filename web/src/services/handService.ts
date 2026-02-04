import { httpClient } from "./fetch";
import { HandSaveRequest } from "@common/interfaces";

export class HandService {
    async createHand(payload: HandSaveRequest): Promise<{ hand_id: string }> {
        const response = await httpClient.post("/hands", payload);
        return response as { hand_id: string };
    }
}
