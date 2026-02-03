/**
 * POST /api/hands integration tests (SI-7).
 * Uses Clerk's createTestingToken() to get a valid Bearer token and validates:
 * - 201: valid body + auth → hand_id
 * - 400: invalid body (missing required field) → Zod details
 * - 401: no auth → Unauthorized
 *
 * For full validation set both in env:
 * - CLERK_SECRET_KEY (for createTestingToken; 201 and 400)
 * - CLERK_PUBLISHABLE_KEY (for Clerk middleware init; 401)
 * Tests that need missing env are skipped (no-op).
 *
 * @see https://clerk.com/docs/guides/sessions/session-tokens
 * @see https://clerk.com/docs/reference/backend/testing-tokens/create-testing-token
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clerkClient } from "@clerk/express";

// Mock server DB so 201 test doesn't hit Neon (transaction no-op)
jest.mock("../../../../server/src/config/database", () => ({
    __esModule: true,
    default: {
        transaction: jest.fn().mockResolvedValue(undefined),
    },
}));

const validBody = {
    hand: {
        table_size: 6,
        button_seat: 0,
        small_blind: 50,
        big_blind: 100,
        ante: 0,
    },
    players: [
        {
            seat_index: 0,
            display_name: "Hero",
            stack_at_start: 10000,
            is_hero: true,
        },
        {
            seat_index: 1,
            display_name: "Villain",
            stack_at_start: 10000,
            is_hero: false,
        },
    ],
    actions: [
        { sequence_index: 0, street: "preflop" as const, action_type: "POST_SB" as const, tags: [] },
        { sequence_index: 1, street: "preflop" as const, action_type: "POST_BB" as const, tags: [] },
    ],
};

function mockReq(overrides: Partial<VercelRequest> & { body?: object }): VercelRequest {
    return {
        method: "POST",
        url: "/api/hands",
        body: validBody,
        headers: {},
        ...overrides,
    } as unknown as VercelRequest;
}

function mockRes(): VercelResponse & { statusCode: number; body: unknown } {
    const res: Record<string, unknown> = {
        statusCode: 200,
        body: undefined as unknown,
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        json(data: unknown) {
            this.body = data;
            return this;
        },
        setHeader: jest.fn().mockReturnThis(),
        end: jest.fn(),
    };
    return res as unknown as VercelResponse & { statusCode: number; body: unknown };
}

describe("POST /api/hands", () => {
    let testingToken: string | null = null;
    let apiHandler: (req: VercelRequest, res: VercelResponse) => Promise<void>;

    beforeAll(async () => {
        apiHandler = (await import("../../../index")).default;
        if (process.env.CLERK_SECRET_KEY) {
            const result = await clerkClient.testingTokens.createTestingToken();
            testingToken = result.token;
        }
    });

    it("returns 201 with hand_id when body is valid and Authorization Bearer token is present", async () => {
        if (!testingToken) {
            return; // skip when CLERK_SECRET_KEY not set
        }
        const req = mockReq({
            headers: { authorization: `Bearer ${testingToken}` },
            body: validBody,
        });
        const res = mockRes();

        await apiHandler(req, res);

        expect((res as any).statusCode).toBe(201);
        expect((res as any).body).toHaveProperty("hand_id");
        expect(typeof (res as any).body.hand_id).toBe("string");
    });

    it("returns 400 with Zod details when required field is missing", async () => {
        if (!testingToken) {
            return; // skip when CLERK_SECRET_KEY not set
        }
        const invalidBody = { ...validBody, hand: { ...validBody.hand, table_size: undefined } } as any;
        const req = mockReq({
            headers: { authorization: `Bearer ${testingToken}` },
            body: invalidBody,
        });
        const res = mockRes();

        await apiHandler(req, res);

        expect((res as any).statusCode).toBe(400);
        expect((res as any).body).toHaveProperty("error", "Validation failed");
        expect((res as any).body).toHaveProperty("details");
    });

    it("returns 401 Unauthorized when Authorization header is missing", async () => {
        if (!process.env.CLERK_PUBLISHABLE_KEY) {
            return; // Clerk middleware requires publishable key to init; skip when unset
        }
        const req = mockReq({ headers: {}, body: validBody });
        const res = mockRes();

        await apiHandler(req, res);

        expect((res as any).statusCode).toBe(401);
        expect((res as any).body).toMatchObject({ error: "Unauthorized" });
    });
});
