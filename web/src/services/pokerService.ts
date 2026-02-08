import { httpClient } from "./httpClient";
import type {
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

class PokerService {
  async getHandEquity(
    players: string[],
    board: string,
    options: EquityOptions = {},
    dead: string[] = [],
    signal?: AbortSignal,
  ): Promise<CalculateEquityResponse> {
    return httpClient.post(
      POKER_ENDPOINTS.getHandEquity,
      { players, board, options, dead },
      signal,
    ) as Promise<CalculateEquityResponse>;
  }

  async compareHands(
    hand1: string,
    hand2: string,
    board: string,
  ): Promise<CompareHandsResponse> {
    return httpClient.post(POKER_ENDPOINTS.compareHands, {
      hand1,
      hand2,
      board,
    }) as Promise<CompareHandsResponse>;
  }

  async evaluateHand(
    hole: string,
    board: string,
  ): Promise<EvaluateHandResponse> {
    return httpClient.post(POKER_ENDPOINTS.evaluateHand, {
      hole,
      board,
    }) as Promise<EvaluateHandResponse>;
  }

  async getOuts(
    hero: string,
    villain: string,
    board: string,
    signal?: AbortSignal,
  ): Promise<CalculateOutsResponse> {
    return httpClient.post(
      POKER_ENDPOINTS.getOuts,
      { hero, villain, board },
      signal,
    ) as Promise<CalculateOutsResponse>;
  }
}

export const pokerService = new PokerService();
