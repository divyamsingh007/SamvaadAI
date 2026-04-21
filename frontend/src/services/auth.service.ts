import type { User } from "../types";
import { apiFetch } from "../lib/apiFetch";

export interface AuthResponse {
  success: boolean;
  message?: string;
  // Backend sendToken returns user and accessToken at root level
  user?: User;
  accessToken?: string;
  error?: string;
}

function extractAccessToken(payload: any): string | undefined {
  return payload?.accessToken || payload?.data?.accessToken || payload?.token;
}

function getStoredToken(): string | null {
  return localStorage.getItem("accessToken");
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };
  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const authService = {
  async register(data: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<AuthResponse> {
    try {
      const response = await apiFetch(`/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Extract specific validation errors if present
        let message = result.message || `Registration failed (${response.status})`;
        if (result.errors && Array.isArray(result.errors)) {
          message = result.errors.map((e: any) => e.message).join(". ");
        }
        return { success: false, message };
      }

      return result as AuthResponse;
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Network error occurred",
      };
    }
  },

  async login(data: {
    email?: string;
    username?: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const response = await apiFetch(`/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          message: result.message || `Login failed (${response.status})`,
        };
      }

      return result as AuthResponse;
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Network error occurred",
      };
    }
  },

  async logout(): Promise<AuthResponse> {
    try {
      const response = await apiFetch(`/auth/logout`, {
        method: "POST",
        headers: authHeaders(),
      });

      const result = await response.json().catch(() => ({}));
      return result as AuthResponse;
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Network error occurred",
      };
    }
  },

  async getMe(): Promise<AuthResponse> {
    try {
      const response = await apiFetch(`/auth/me`, {
        method: "GET",
        headers: authHeaders(),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Session expired",
        };
      }

      // getMe returns { success, data: { user } }
      return {
        success: true,
        user: result.data?.user,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Network error occurred",
      };
    }
  },

  async refreshAccessToken(): Promise<AuthResponse> {
    try {
      const response = await apiFetch(`/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Unable to refresh session",
        };
      }

      const accessToken = extractAccessToken(result);
      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
      }

      return {
        success: true,
        message: result.message,
        accessToken,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Network error occurred",
      };
    }
  },
};
