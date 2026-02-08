import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { httpClient, setTokenProvider } from "./httpClient";

describe("httpClient", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    setTokenProvider(async () => null);
  });

  it("makes a GET request to the correct URL", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await httpClient.get("/test");
    expect(result).toEqual({ ok: true });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/test",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("makes a POST request with body", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ id: "123" }), {
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await httpClient.post("/items", { name: "test" });
    expect(result).toEqual({ id: "123" });

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify({ name: "test" }));
  });

  it("attaches Bearer token when token provider is set", async () => {
    setTokenProvider(async () => "test-token-123");

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({}), {
        headers: { "content-type": "application/json" },
      }),
    );

    await httpClient.get("/auth-test");

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(options.headers["Authorization"]).toBe("Bearer test-token-123");
  });

  it("does not attach token when provider returns null", async () => {
    setTokenProvider(async () => null);

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({}), {
        headers: { "content-type": "application/json" },
      }),
    );

    await httpClient.get("/no-auth");

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(options.headers["Authorization"]).toBeUndefined();
  });

  it("throws an error with status on non-ok response", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      }),
    );

    try {
      await httpClient.get("/missing");
      expect.fail("Should have thrown");
    } catch (error: unknown) {
      expect((error as Error).message).toBe("Not found");
      expect((error as Error & { status: number }).status).toBe(404);
    }
  });

  it("supports AbortSignal", async () => {
    const controller = new AbortController();
    controller.abort();

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new DOMException("The operation was aborted.", "AbortError"),
    );

    await expect(
      httpClient.get("/abort-test", controller.signal),
    ).rejects.toThrow("aborted");
  });

  it("makes DELETE requests", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: { "content-type": "text/plain" },
      }),
    );

    await httpClient.delete("/items/123");

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(options.method).toBe("DELETE");
  });

  it("makes PUT requests with body", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ updated: true }), {
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await httpClient.put("/items/123", { name: "updated" });
    expect(result).toEqual({ updated: true });

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(options.method).toBe("PUT");
  });
});
