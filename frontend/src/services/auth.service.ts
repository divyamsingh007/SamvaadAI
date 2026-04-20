import type { User } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export interface AuthResponse {
  success: boolean;
  message?: string;
  // Backend sendToken returns user and accessToken at root level
  user?: User;
  accessToken?: string;
  error?: string;
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
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: authHeaders(),
        credentials: "include",
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
      const token = getStoredToken();
      if (!token) {
        return { success: false, message: "No token found" };
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: authHeaders(),
        credentials: "include",
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
};
