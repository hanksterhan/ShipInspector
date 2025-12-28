import { clerkService } from "./clerkService";

export class HttpClient {
    private baseUrl: string;
    private defaultHeaders: HeadersInit;

    constructor(baseUrl: string, headers?: HeadersInit) {
        this.baseUrl = baseUrl;
        this.defaultHeaders = headers || {
            "Content-Type": "application/json",
            Accept: "application/json",
        };
    }

    /**
     * Get headers with Clerk token included
     */
    private async getHeaders(): Promise<HeadersInit> {
        const headers = { ...this.defaultHeaders };

        // Add Clerk token if available
        try {
            const token = await clerkService.getToken();
            if (token) {
                (headers as any)["Authorization"] = `Bearer ${token}`;
            }
        } catch (error) {
            // Token not available - user not authenticated
        }

        return headers;
    }

    private async request(
        method: string,
        url: string,
        body?: any,
        signal?: AbortSignal
    ): Promise<any> {
        const headers = await this.getHeaders();

        const response = await fetch(`${this.baseUrl}${url}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null,
            signal,
            credentials: "include", // Include cookies for backward compatibility
        });

        if (!response.ok) {
            let errorMessage = "Request failed";
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch {
                // If response is not JSON, try to get text
                try {
                    errorMessage = await response.text();
                } catch {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
            }
            const error = new Error(errorMessage);
            (error as any).status = response.status;
            throw error;
        }

        // Handle empty responses
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const text = await response.text();
            return text ? JSON.parse(text) : {};
        }
        return {};
    }

    async get(url: string, signal?: AbortSignal): Promise<any> {
        return this.request("GET", url, undefined, signal);
    }

    async post(url: string, body: any, signal?: AbortSignal): Promise<any> {
        return this.request("POST", url, body, signal);
    }

    async put(url: string, body: any, signal?: AbortSignal): Promise<any> {
        return this.request("PUT", url, body, signal);
    }

    async patch(url: string, body: any, signal?: AbortSignal): Promise<any> {
        return this.request("PATCH", url, body, signal);
    }
}

// Get API URL from environment variable, fallback to localhost for development
// @ts-ignore - process.env is replaced at build time by webpack
const API_URL = process.env.API_URL || "http://localhost:3000";

export const httpClient = new HttpClient(API_URL);
