import { httpClient } from "./fetch";
import {
    HandReplay,
    SaveHandReplayRequest,
    SaveHandReplayResponse,
    LoadHandReplayResponse,
    ListHandReplaysRequest,
    ListHandReplaysResponse,
    DeleteHandReplayResponse,
} from "@common/interfaces";

const REPLAY_ENDPOINTS = {
    save: "/poker/replay/save",
    load: (id: string) => `/poker/replay/${id}`,
    list: "/poker/replay/list",
    delete: (id: string) => `/poker/replay/${id}`,
};

export class ReplayService {
    constructor() {}

    async saveReplay(
        replay: HandReplay,
        signal?: AbortSignal
    ): Promise<SaveHandReplayResponse> {
        const request: SaveHandReplayRequest = { replay };
        const response = await httpClient.post(
            REPLAY_ENDPOINTS.save,
            request,
            signal
        );
        return response as SaveHandReplayResponse;
    }

    async loadReplay(
        id: string,
        signal?: AbortSignal
    ): Promise<LoadHandReplayResponse> {
        const response = await httpClient.get(
            REPLAY_ENDPOINTS.load(id),
            signal
        );
        return response as LoadHandReplayResponse;
    }

    async listReplays(
        options?: ListHandReplaysRequest,
        signal?: AbortSignal
    ): Promise<ListHandReplaysResponse> {
        const queryParams = new URLSearchParams();
        if (options?.limit) {
            queryParams.append("limit", options.limit.toString());
        }
        if (options?.offset) {
            queryParams.append("offset", options.offset.toString());
        }
        if (options?.search) {
            queryParams.append("search", options.search);
        }

        const url =
            REPLAY_ENDPOINTS.list +
            (queryParams.toString() ? `?${queryParams.toString()}` : "");
        const response = await httpClient.get(url, signal);
        return response as ListHandReplaysResponse;
    }

    async deleteReplay(
        id: string,
        signal?: AbortSignal
    ): Promise<DeleteHandReplayResponse> {
        const response = await httpClient.delete(
            REPLAY_ENDPOINTS.delete(id),
            signal
        );
        return response as DeleteHandReplayResponse;
    }
}

