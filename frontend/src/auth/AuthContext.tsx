import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient, setAccessToken } from "@/api/client";

export interface AuthUser {
  id: string; name: string; email: string; role: string; permissions: string[];
  isActive: boolean; lastLoginAt: string | null; createdAt: string;
}
interface AuthContextValue { user: AuthUser | null; loading: boolean; isAuthenticated: boolean; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void>; can: (permission: string) => boolean; }
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiClient.get("/auth/me").then((response) => setUser(response.data ?? response)).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
  async function login(email: string, password: string) { const response = await apiClient.post("/auth/login", { email, password }); setAccessToken(response.data.accessToken); setUser(response.data.user); }
  async function logout() { try { await apiClient.post("/auth/logout"); } finally { setAccessToken(null); setUser(null); } }
  return <AuthContext.Provider value={{ user, loading, isAuthenticated: Boolean(user), login, logout, can: (permission) => Boolean(user?.permissions.includes(permission)) }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used inside AuthProvider"); return context; }
