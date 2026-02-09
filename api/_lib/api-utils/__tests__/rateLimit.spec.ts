import { VercelRequest, VercelResponse } from "@vercel/node";
import { createRateLimiter, getClientIp } from "../rateLimit";

// Mock redisClient to return null (no Redis)
jest.mock("../redisClient", () => ({
    getRedisClient: () => null,
}));

function mockReq(headers: Record<string, string | string[]> = {}): VercelRequest {
    return {
        headers,
        socket: { remoteAddress: "127.0.0.1" },
    } as any;
}

function mockRes(): VercelResponse & {
    _status: number;
    _json: any;
    _headers: Record<string, string | number>;
} {
    const res: any = {
        _status: 200,
        _json: null,
        _headers: {},
        status(code: number) {
            res._status = code;
            return res;
        },
        json(body: any) {
            res._json = body;
            return res;
        },
        setHeader(key: string, value: string | number) {
            res._headers[key] = value;
            return res;
        },
    };
    return res;
}

describe("getClientIp", () => {
    it("returns x-forwarded-for first value", () => {
        const req = mockReq({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
        expect(getClientIp(req)).toBe("1.2.3.4");
    });

    it("returns x-forwarded-for when array", () => {
        const req = mockReq({ "x-forwarded-for": ["9.8.7.6", "5.4.3.2"] });
        expect(getClientIp(req)).toBe("9.8.7.6");
    });

    it("returns x-real-ip when no forwarded", () => {
        const req = mockReq({ "x-real-ip": "10.0.0.1" });
        expect(getClientIp(req)).toBe("10.0.0.1");
    });

    it("returns x-real-ip array first value", () => {
        const req = mockReq({ "x-real-ip": ["10.0.0.2", "10.0.0.3"] });
        expect(getClientIp(req)).toBe("10.0.0.2");
    });

    it("falls back to socket remoteAddress", () => {
        const req = mockReq();
        expect(getClientIp(req)).toBe("127.0.0.1");
    });

    it("returns unknown when no IP source", () => {
        const req = { headers: {}, socket: {} } as any;
        expect(getClientIp(req)).toBe("unknown");
    });
});

describe("createRateLimiter (in-memory fallback)", () => {
    it("allows requests within the limit", async () => {
        const limiter = createRateLimiter(60000, 3);
        const req = mockReq({ "x-forwarded-for": "unique-ip-1" });

        for (let i = 0; i < 3; i++) {
            const res = mockRes();
            const allowed = await limiter(req, res);
            expect(allowed).toBe(true);
            expect(res._headers["X-RateLimit-Limit"]).toBe(3);
            expect(res._headers["X-RateLimit-Remaining"]).toBe(3 - (i + 1));
        }
    });

    it("blocks requests over the limit with 429", async () => {
        const limiter = createRateLimiter(60000, 2, "Custom rate limit message");
        const req = mockReq({ "x-forwarded-for": "unique-ip-2" });

        // Use up the limit
        await limiter(req, mockRes());
        await limiter(req, mockRes());

        // Third request should be blocked
        const res = mockRes();
        const allowed = await limiter(req, res);
        expect(allowed).toBe(false);
        expect(res._status).toBe(429);
        expect(res._json.error).toBe("Custom rate limit message");
        expect(res._json.retryAfter).toBeGreaterThan(0);
    });

    it("sets rate limit headers on all responses", async () => {
        const limiter = createRateLimiter(60000, 5);
        const req = mockReq({ "x-forwarded-for": "unique-ip-3" });
        const res = mockRes();

        await limiter(req, res);

        expect(res._headers["X-RateLimit-Limit"]).toBe(5);
        expect(res._headers["X-RateLimit-Remaining"]).toBe(4);
        expect(res._headers["X-RateLimit-Reset"]).toBeDefined();
    });

    it("sets Retry-After header on 429 responses", async () => {
        const limiter = createRateLimiter(60000, 1);
        const req = mockReq({ "x-forwarded-for": "unique-ip-4" });

        await limiter(req, mockRes()); // Use the one allowed request

        const res = mockRes();
        await limiter(req, res);

        expect(res._status).toBe(429);
        expect(res._headers["Retry-After"]).toBeGreaterThan(0);
    });

    it("resets after window expires", async () => {
        const limiter = createRateLimiter(1, 1); // 1ms window
        const req = mockReq({ "x-forwarded-for": "unique-ip-5" });

        await limiter(req, mockRes());

        // Wait for window to expire
        await new Promise((resolve) => setTimeout(resolve, 10));

        const res = mockRes();
        const allowed = await limiter(req, res);
        expect(allowed).toBe(true);
    });
});
