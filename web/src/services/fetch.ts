export class HttpClient {
    private baseUrl: string;
    private headers: HeadersInit;

    constructor(baseUrl: string, headers?: HeadersInit) {
        this.baseUrl = baseUrl;
        this.headers = headers || {
            "Content-Type": "application/json",
            Accept: "application/json",
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
        });

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch {
                // If JSON parsing fails, try text
                try {
                    const errorText = await response.text();
                    if (errorText) {
                        errorMessage = errorText;
                    }
                } catch {
                    // Use default error message
                }
            }
            throw new Error(errorMessage);
        }

        return response.json();
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

    async delete(url: string, signal?: AbortSignal): Promise<any> {
        return this.request("DELETE", url, undefined, signal);
    }
}

export const httpClient = new HttpClient("http://localhost:3000");
