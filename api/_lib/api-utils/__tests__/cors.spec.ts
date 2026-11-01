import { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../cors";

function run(origin: string | undefined, { method = "GET", host = "api.example.test", env = "production", configured }: { method?: string; host?: string; env?: string; configured?: string } = {}) {
    const previous = { NODE_ENV: process.env.NODE_ENV, CORS_ORIGIN: process.env.CORS_ORIGIN };
    process.env.NODE_ENV = env;
    if (configured === undefined) delete process.env.CORS_ORIGIN; else process.env.CORS_ORIGIN = configured;
    const headers: Record<string, string> = { host };
    if (origin !== undefined) headers.origin = origin;
    let status = 200;
    const set: Record<string, string> = {};
    const req = { method, headers } as unknown as VercelRequest;
    const res = {
        setHeader(name: string, value: string) { set[name.toLowerCase()] = value; return this; },
        status(code: number) { status = code; return this; },
        json() { return this; },
        end() { return this; },
    } as unknown as VercelResponse;
    try {
        const next = handleCors(req, res);
        return { next, status, allow: set["access-control-allow-origin"], credentials: set["access-control-allow-credentials"], vary: set.vary };
    } finally {
        process.env.NODE_ENV = previous.NODE_ENV;
        if (previous.CORS_ORIGIN === undefined) delete process.env.CORS_ORIGIN; else process.env.CORS_ORIGIN = previous.CORS_ORIGIN;
    }
}

describe("API CORS", () => {
    it("allows the exact production browser hosts with credentials", () => {
        for (const origin of ["https://www.sipoker.club", "https://sipoker.club"]) {
            expect(run(origin)).toMatchObject({ next: true, allow: origin, credentials: "true", vary: "Origin" });
        }
    });
    it("rejects look-alike, suffix, and preview domains in production", () => {
        for (const origin of ["https://sipoker.club.evil.example", "https://evilsipoker.club", "https://www.sipoker.club.attacker.test",
            "http://www.sipoker.club", "https://attacker.vercel.app", "https://x.vercel.app.evil.example", "null", "https://www.sipoker.club:8443"]) {
            const result = run(origin);
            expect(result).toMatchObject({ next: false, status: 403 });
            expect(result.allow).toBeUndefined();
        }
    });
    it("allows a same-origin browser request, such as a Vercel preview calling its own API", () => {
        expect(run("https://ship-git-branch.vercel.app", { host: "ship-git-branch.vercel.app" })).toMatchObject({ next: true, allow: "https://ship-git-branch.vercel.app" });
        expect(run("https://ship-git-branch.vercel.app", { host: "other.vercel.app" })).toMatchObject({ next: false, status: 403 });
    });
    it("allows only exact configured origins", () => {
        const configured = "https://preview.example.test, http://localhost:4000";
        expect(run("https://preview.example.test", { configured })).toMatchObject({ next: true, allow: "https://preview.example.test" });
        expect(run("https://preview.example.test.evil", { configured })).toMatchObject({ next: false, status: 403 });
        expect(run("https://www.sipoker.club", { configured })).toMatchObject({ next: true });
    });
    it("lets non-browser requests through without a wildcard credentialed response", () => {
        const result = run(undefined);
        expect(result.next).toBe(true);
        expect(result.allow).toBeUndefined();
    });
    it("allows only loopback browser origins in development", () => {
        for (const origin of ["http://localhost:4000", "http://127.0.0.1:6006"]) expect(run(origin, { env: "development" })).toMatchObject({ next: true, allow: origin });
        for (const origin of ["https://evil.example", "http://localhost.evil.example", "http://localhost:4000.evil.example"]) {
            expect(run(origin, { env: "development" })).toMatchObject({ next: false, status: 403 });
        }
    });
    it("answers an allowed preflight without calling the route", () => {
        expect(run("https://www.sipoker.club", { method: "OPTIONS" })).toMatchObject({ next: false, status: 200, allow: "https://www.sipoker.club" });
    });
});
