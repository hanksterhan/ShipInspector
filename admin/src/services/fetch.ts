export class HttpClient {
    private baseUrl: string;
    private headers: HeadersInit;

    constructor(baseUrl: string, headers?: HeadersInit) {
        this.baseUrl = baseUrl;
        this.headers = {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Admin-App": "true", // Identify requests from admin app
            ...headers,
        };
    }

    private async request(
        method: string,
        url: string,
        body?: any,
        signal?: AbortSignal
    ): Promise<any> {
        const response = await fetch(`${this.baseUrl}${url}`, {
            method,
            headers: this.headers,
            body: body ? JSON.stringify(body) : null,
            signal,
            credentials: "include", // Include cookies in requests
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

export const httpClient = new HttpClient("http://localhost:3000");
