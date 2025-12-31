import { httpClient } from "./fetch";
import {
    CompareHandsResponse,
    EquityOptions,
    EvaluateHandResponse,
    CalculateEquityResponse,
    CalculateOutsResponse,
} from "@common/interfaces";

const POKER_ENDPOINTS = {
    getHandEquity: "/poker/equity/calculate",
    compareHands: "/poker/hand/compare",
    evaluateHand: "/poker/hand/evaluate",
    getOuts: "/poker/outs/calculate",
};

export class PokerService {
    constructor() {}

    async getHandEquity(
        players: string[],
        board: string,
        options: EquityOptions = {},
        dead: string[] = [],
        signal?: AbortSignal
    ): Promise<CalculateEquityResponse> {
        const response = await httpClient.post(
            POKER_ENDPOINTS.getHandEquity,
            {
                players,
                board,
                options,
                dead,
            },
            signal
        );
        return response as CalculateEquityResponse;
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
        return response as CompareHandsResponse;
    }

    async evaluateHand(
        hole: string,
        board: string
    ): Promise<EvaluateHandResponse> {
        const response = await httpClient.post(POKER_ENDPOINTS.evaluateHand, {
            hole,
            board,
        });
        return response as EvaluateHandResponse;
    }

    async getOuts(
        hero: string,
        villain: string,
        board: string,
        signal?: AbortSignal
    ): Promise<CalculateOutsResponse> {
        const response = await httpClient.post(
            POKER_ENDPOINTS.getOuts,
            {
                hero,
                villain,
                board,
            },
            signal
        );
        return response as CalculateOutsResponse;
    }
}
