import type {
  TableCommandRequest,
  TableSettings,
  TableSummary,
  TableView,
} from "@common/interfaces/tableInterfaces";
import { httpClient } from "./httpClient";

export const tableService = {
  list: () =>
    httpClient.get("/api/tables") as Promise<{ tables: TableSummary[] }>,
  create: (settings: TableSettings, displayName?: string) =>
    httpClient.post("/api/tables", {
      settings,
      ...(displayName ? { displayName } : {}),
    }) as Promise<TableView>,
  get: (id: string, signal?: AbortSignal) =>
    httpClient.get(`/api/tables/${id}`, signal) as Promise<TableView>,
  command: (id: string, input: TableCommandRequest) =>
    httpClient.post(
      `/api/tables/${id}/commands`,
      input,
      AbortSignal.timeout(12000),
    ) as Promise<TableView>,
  issueAgent: (id: string, version: number, name: string, requestId: string) =>
    httpClient.post(`/api/tables/${id}/agents`, {
      version,
      name,
      requestId,
    }) as Promise<{ table: TableView; token: string; agentId: string }>,
  revokeAgent: (
    id: string,
    version: number,
    agentId: string,
    requestId: string,
  ) =>
    httpClient.post(`/api/tables/${id}/revoke-agent`, {
      version,
      agentId,
      requestId,
    }) as Promise<TableView>,
};
