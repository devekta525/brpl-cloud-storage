import React, { createContext, useContext, useState, useCallback } from "react";
import { authApi, ApiException } from "@/lib/api";

// Export types for use in other components
export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
  parentId?: string | null;
  children?: string[];
}

export interface Bucket {
  id: string;
  name: string;
  region: string;
  createdAt: string;
  files: StoredFile[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  token: string;
}

interface AppContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const u = localStorage.getItem("user");
    if (u) {
      try {
        return JSON.parse(u);
      } catch {
        return null;
      }
    }
    return null;
  });

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Try login first
      let data;
      try {
        data = await authApi.login(email, password);
      } catch (error) {
        // If login fails with 401/400/404, try to register
        if (error instanceof ApiException && (error.status === 401 || error.status === 400 || error.status === 404)) {
          try {
            data = await authApi.register(email.split("@")[0], email, password);
          } catch (registerError) {
            const message = registerError instanceof ApiException 
              ? registerError.message 
              : "Failed to register. Please try again.";
            return { success: false, error: message };
          }
        } else {
          const message = error instanceof ApiException 
            ? error.message 
            : "Invalid email or password";
          return { success: false, error: message };
        }
      }

      // Success - store user data
      const u = { id: data._id, name: data.name, email: data.email, token: data.token };
      setUser(u);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(u));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  return (
    <AppContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
    }}>
      {children}
    </AppContext.Provider>
  );
};
