import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "../types";
import { authService } from "../services/auth.service";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: any) => Promise<{ success: boolean; message?: string }>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check if we have a stored token and validate it
  useEffect(() => {
    const initAuth = async () => {
      const meResponse = await authService.getMe();

      if (meResponse.success && meResponse.user) {
        setUser(meResponse.user);
        setIsLoading(false);
        return;
      }

      // If access token is missing/expired but refresh cookie is valid,
      // request a fresh access token and retry session fetch once.
      const refreshResponse = await authService.refreshAccessToken();
      if (refreshResponse.success) {
        const retryMeResponse = await authService.getMe();
        if (retryMeResponse.success && retryMeResponse.user) {
          setUser(retryMeResponse.user);
          setIsLoading(false);
          return;
        }
      }

      localStorage.removeItem("accessToken");
      setUser(null);
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (data: any) => {
    setIsLoading(true);
    const res = await authService.login(data);

    if (res.success && res.user) {
      setUser(res.user);
      // Backend sendToken returns accessToken at root level
      if (res.accessToken) {
        localStorage.setItem("accessToken", res.accessToken);
      }
    }

    setIsLoading(false);
    return { success: res.success, message: res.message };
  };

  const register = async (data: any) => {
    setIsLoading(true);
    const res = await authService.register(data);

    if (res.success && res.user) {
      setUser(res.user);
      if (res.accessToken) {
        localStorage.setItem("accessToken", res.accessToken);
      }
    }

    setIsLoading(false);
    return { success: res.success, message: res.message };
  };

  const logout = async () => {
    setIsLoading(true);
    await authService.logout();
    localStorage.removeItem("accessToken");
    setUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
