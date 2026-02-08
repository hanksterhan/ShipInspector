import { httpClient } from "./httpClient";

export interface User {
  userId: string;
  email: string;
  role?: string;
  clerkData?: {
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string;
  };
}

class AuthService {
  async getCurrentUser(): Promise<User> {
    try {
      const response = (await httpClient.get("/auth/me")) as {
        user: User;
      };
      return response.user;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error as Error & { status?: number }).status === 401
      ) {
        const authError = new Error("Not authenticated");
        (authError as Error & { status: number; isAuthError: boolean }).status =
          401;
        (
          authError as Error & { status: number; isAuthError: boolean }
        ).isAuthError = true;
        throw authError;
      }
      throw error;
    }
  }
}

export const authService = new AuthService();
