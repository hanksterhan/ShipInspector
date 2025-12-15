import { httpClient } from "./fetch";
import {
    CompareHandsResponse,
    EquityOptions,
    EquityResult,
    EvaluateHandResponse,
} from "@common/interfaces";

const POKER_ENDPOINTS = {
    getHandEquity: "/poker/equity/calculate",
    compareHands: "/poker/hand/compare",
    evaluateHand: "/poker/hand/evaluate",
};

export class PokerService {
    constructor() {}

    async getHandEquity(
        players: string[],
        board: string,
        options: EquityOptions,
        dead: string[] = []
    ): Promise<EquityResult> {
        const response = await httpClient.post(POKER_ENDPOINTS.getHandEquity, {
            players,
            board,
            options,
            dead,
        });
        return response.data as EquityResult;
    }

    async compareHands(
        hand1: string,
        hand2: string,
        board: string
    ): Promise<CompareHandsResponse> {
        const response = await httpClient.post(POKER_ENDPOINTS.compareHands, {
            hand1,
            hand2,
            board,
        });
        return response.data as CompareHandsResponse;
    }

    async evaluateHand(
        hole: string,
        board: string
    ): Promise<EvaluateHandResponse> {
        const response = await httpClient.post(POKER_ENDPOINTS.evaluateHand, {
            hole,
            board,
        });
        return response.data as EvaluateHandResponse;
    }
}
