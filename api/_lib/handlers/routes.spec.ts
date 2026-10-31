import type { VercelRequest, VercelResponse } from "@vercel/node";
import router from "../../index";
import { clerkMiddlewareInstance } from "../../_helpers";
import { tablesHandler } from "./tables";

// The real router runs with a local Clerk stand-in; no request leaves the test.
jest.mock("../../_helpers", () => ({ clerkMiddlewareInstance: jest.fn((_req, _res, next) => next()) }));
jest.mock("./tables", () => ({ tablesHandler: jest.fn(async (_req, res) => { res.status(200).json({ routed: true }); }) }));

const id = "6f1c2f8e-6c4b-4b8e-9d5e-3a2f1b0c9d8e";
async function route(url: string, authorization?: string) {
  let status = 200; let data: any;
  const req = { method: "GET", url, headers: authorization ? { authorization } : {}, socket: {} } as unknown as VercelRequest;
  const res = { setHeader() {}, status(code: number) { status = code; return this; }, json(value: unknown) { data = value; return this; } } as unknown as VercelResponse;
  await router(req, res);
  return { status, data, params: (req as any).params };
}
describe("API router", () => {
  beforeEach(() => { jest.clearAllMocks(); });
  it("sends a browser hand record request through Clerk to the table handler", async () => {
    const result = await route(`/api/tables/${id}/hands/3`);
    expect(clerkMiddlewareInstance).toHaveBeenCalledTimes(1);
    expect(tablesHandler).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 200, data: { routed: true }, params: { id, n: "3" } });
  });
  it("sends an agent hand record request to the table handler, which checks the token", async () => {
    const result = await route(`/api/tables/${id}/hands/3`, `Bearer si_agent_${id}.secret`);
    expect(clerkMiddlewareInstance).not.toHaveBeenCalled();
    expect(tablesHandler).toHaveBeenCalledTimes(1);
    expect(result.params).toEqual({ id, n: "3" });
  });
  it("still refuses paths that no route names", async () => {
    for (const url of [`/api/tables/${id}/hands`, `/api/tables/${id}/hands/3/extra`]) {
      expect((await route(url)).status).toBe(404);
      expect((await route(url, `Bearer si_agent_${id}.secret`)).status).toBe(404);
    }
    expect(tablesHandler).not.toHaveBeenCalled();
  });
});
