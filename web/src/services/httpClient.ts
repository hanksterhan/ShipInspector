type TokenProvider = () => Promise<string | null>;

let tokenProvider: TokenProvider = async () => null;

/**
 * Set the token provider function used by HttpClient for authentication.
 * Call this once at app initialization with a function that returns
 * the current auth token (e.g., Clerk's getToken).
 */
export function setTokenProvider(provider: TokenProvider): void {
  tokenProvider = provider;
}

class HttpClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor(baseUrl: string, headers?: HeadersInit) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = headers || {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
    } as Record<string, string>;

    try {
      const token = await tokenProvider();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch {
      // Token not available
    }

    return headers;
  }

  private async request(
    method: string,
    url: string,
    body?: unknown,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const headers = await this.getHeaders();

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${url}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
        signal,
        credentials: "include",
      });
    } catch (error) {
      if (
        signal?.aborted ||
        (error instanceof Error && error.name === "AbortError")
      )
        throw error;
      // Browser network errors can include a malformed URL. Do not display it.
      throw new Error(
        "Could not reach the server. Check your connection and try again.",
      );
    }

    if (!response.ok) {
      let errorMessage = "Request failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        try {
          errorMessage = await response.text();
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      }
      const error = new Error(errorMessage);
      (error as Error & { status: number }).status = response.status;
      throw error;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    }
    return {};
  }

  async get(url: string, signal?: AbortSignal): Promise<unknown> {
    return this.request("GET", url, undefined, signal);
  }

  async post(
    url: string,
    body: unknown,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request("POST", url, body, signal);
  }

  async put(
    url: string,
    body: unknown,
    signal?: AbortSignal,
  ): Promise<unknown> {
    return this.request("PUT", url, body, signal);
  }

  async delete(url: string, signal?: AbortSignal): Promise<unknown> {
    return this.request("DELETE", url, undefined, signal);
  }
}

function resolveApiUrl(): string {
  let apiUrl = import.meta.env.VITE_API_URL || "";

  if (apiUrl === "" || apiUrl === "proxy" || apiUrl === "relative") {
    return "";
  }

  if (!apiUrl.startsWith("http://") && !apiUrl.startsWith("https://")) {
    apiUrl = `https://${apiUrl}`;
  }

  apiUrl = apiUrl.replace(/\/$/, "");

  // Handle www/non-www mismatch to avoid CORS redirect issues
  if (typeof window !== "undefined" && window.location.origin) {
    try {
      const currentHost = new URL(window.location.origin).hostname;
      const apiHost = new URL(apiUrl).hostname;
      const normalize = (h: string) => h.replace(/^www\./, "");
      if (
        normalize(currentHost) === normalize(apiHost) &&
        currentHost !== apiHost
      ) {
        return "";
      }
    } catch {
      // URL parsing failed, use apiUrl as-is
    }
  }

  return apiUrl;
}

export const httpClient = new HttpClient(resolveApiUrl());
