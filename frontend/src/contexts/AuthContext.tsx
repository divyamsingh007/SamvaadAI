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
      const token = localStorage.getItem("accessToken");
      if (token) {
        const res = await authService.getMe();
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          // Token is invalid or expired — clean up
          localStorage.removeItem("accessToken");
          setUser(null);
        }
      }
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
