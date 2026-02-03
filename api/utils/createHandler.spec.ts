import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHandler } from "./createHandler";
import * as cors from "./cors";
import * as rateLimit from "./rateLimit";
import * as auth from "./auth";
import * as logger from "./logger";
import * as errorHandler from "./errorHandler";

// Mock all dependencies
jest.mock("./cors");
jest.mock("./rateLimit");
jest.mock("./auth");
jest.mock("./logger");
jest.mock("./errorHandler");

describe("createHandler", () => {
    let mockReq: Partial<VercelRequest>;
    let mockRes: Partial<VercelResponse>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;
    let endMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        statusMock = jest.fn().mockReturnThis();
        jsonMock = jest.fn().mockReturnThis();
        endMock = jest.fn().mockReturnThis();

        mockReq = {
            method: "POST",
            headers: {},
            url: "/api/test",
        };

        mockRes = {
            status: statusMock,
            json: jsonMock,
            end: endMock,
            setHeader: jest.fn(),
        } as any;

        // Default mocks - success case
        (cors.handleCors as jest.Mock).mockReturnValue(true);
        (rateLimit.globalRateLimiter as jest.Mock).mockReturnValue(true);
        (rateLimit.strictRateLimiter as jest.Mock).mockReturnValue(true);
        (auth.requireAuth as jest.Mock).mockReturnValue({ userId: "test-user-123" });
        (logger.logRequest as jest.Mock).mockReturnValue({
            logComplete: jest.fn(),
        });
    });

    it("returns 405 for wrong HTTP method", async () => {
        mockReq.method = "GET";

        const businessLogic = jest.fn();
        const handler = createHandler({ method: "POST" }, businessLogic);

        await handler(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(statusMock).toHaveBeenCalledWith(405);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Method not allowed" });
        expect(businessLogic).not.toHaveBeenCalled();
    });

    it("handles CORS preflight (OPTIONS) requests", async () => {
        mockReq.method = "OPTIONS";
        (cors.handleCors as jest.Mock).mockReturnValue(false); // CORS handles OPTIONS

        const businessLogic = jest.fn();
        const handler = createHandler({ method: "POST" }, businessLogic);

        await handler(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(cors.handleCors).toHaveBeenCalled();
        expect(businessLogic).not.toHaveBeenCalled();
    });

    it("applies global rate limiter by default", async () => {
        const businessLogic = jest.fn();
        const handler = createHandler({ method: "POST" }, businessLogic);

        await handler(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(rateLimit.globalRateLimiter).toHaveBeenCalledWith(mockReq, mockRes);
        expect(rateLimit.strictRateLimiter).not.toHaveBeenCalled();
    });

    it("applies strict rate limiter when configured", async () => {
        const businessLogic = jest.fn();
        const handler = createHandler(
            { method: "POST", rateLimit: "strict" },
            businessLogic
        );

        await handler(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(rateLimit.strictRateLimiter).toHaveBeenCalledWith(mockReq, mockRes);
        expect(rateLimit.globalRateLimiter).not.toHaveBeenCalled();
    });

    it("returns 401 when auth fails with 'Not authenticated'", async () => {
        (auth.requireAuth as jest.Mock).mockImplementation(() => {
            throw new Error("Not authenticated");
        });

        const businessLogic = jest.fn();
        const handler = createHandler({ method: "POST" }, businessLogic);

        await handler(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({ error: "Not authenticated" });
        expect(businessLogic).not.toHaveBeenCalled();
    });

    it("passes userId to business logic when auth succeeds", async () => {
        const businessLogic = jest.fn();
        const handler = createHandler({ method: "POST" }, businessLogic);

        await handler(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(businessLogic).toHaveBeenCalledWith(
            mockReq,
            mockRes,
            expect.objectContaining({ userId: "test-user-123" })
        );
    });

    it("calls handleError for unexpected errors", async () => {
        const testError = new Error("Database connection failed");
        const businessLogic = jest.fn().mockRejectedValue(testError);
        const handler = createHandler({ method: "POST" }, businessLogic);

        await handler(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(errorHandler.handleError).toHaveBeenCalledWith(
            testError,
            mockRes,
            500
        );
    });

    it("calls logger.logComplete is available to business logic", async () => {
        const logCompleteMock = jest.fn();
        (logger.logRequest as jest.Mock).mockReturnValue({
            logComplete: logCompleteMock,
        });

        const businessLogic = jest.fn();
        const handler = createHandler({ method: "POST" }, businessLogic);

        await handler(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(logger.logRequest).toHaveBeenCalled();
        expect(businessLogic).toHaveBeenCalledWith(
            mockReq,
            mockRes,
            expect.objectContaining({
                logger: { logComplete: logCompleteMock },
            })
        );
    });

    it("provides startTime in context to business logic", async () => {
        const businessLogic = jest.fn();
        const handler = createHandler({ method: "POST" }, businessLogic);

        const beforeCall = Date.now();
        await handler(mockReq as VercelRequest, mockRes as VercelResponse);
        const afterCall = Date.now();

        expect(businessLogic).toHaveBeenCalledWith(
            mockReq,
            mockRes,
            expect.objectContaining({
                startTime: expect.any(Number),
            })
        );

        const context = businessLogic.mock.calls[0][2];
        expect(context.startTime).toBeGreaterThanOrEqual(beforeCall);
        expect(context.startTime).toBeLessThanOrEqual(afterCall);
    });

    it("stops execution when rate limiter fails", async () => {
        (rateLimit.globalRateLimiter as jest.Mock).mockReturnValue(false);

        const businessLogic = jest.fn();
        const handler = createHandler({ method: "POST" }, businessLogic);

        await handler(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(businessLogic).not.toHaveBeenCalled();
    });

    it("works with GET method when configured", async () => {
        mockReq.method = "GET";

        const businessLogic = jest.fn();
        const handler = createHandler({ method: "GET" }, businessLogic);

        await handler(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(businessLogic).toHaveBeenCalled();
        expect(statusMock).not.toHaveBeenCalledWith(405);
    });
});
