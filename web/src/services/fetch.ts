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
let API_URL = process.env.API_URL || "http://localhost:3000";

// If API_URL is empty or "proxy", use relative paths (will be proxied by Vercel)
// This allows requests to go through the Vercel proxy configured in vercel.json
if (API_URL === "" || API_URL === "proxy" || API_URL === "relative") {
    API_URL = "";
} else {
    // Normalize API_URL: ensure it has a protocol to prevent relative URL issues
    // If API_URL doesn't start with http:// or https://, add https://
    if (API_URL && !API_URL.startsWith("http://") && !API_URL.startsWith("https://")) {
        // Assume https for production domains
        API_URL = `https://${API_URL}`;
    }

    // Remove trailing slash if present
    API_URL = API_URL.replace(/\/$/, "");
}

export const httpClient = new HttpClient(API_URL);
