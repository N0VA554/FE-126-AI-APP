"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { postJson } from "@/src/lib/api/http";
import { DEV_AUTH_BYPASS, PUBLIC_API_BASE_URL } from "@/src/lib/api/config";

export type UserRole = "LECTURER" | "STUDENT" | "ADMIN";

export interface AuthUser {
  created_at?: string;
  email: string;
  full_name: string;
  is_active: number;
  role: UserRole;
  uni_id: number;
  user_id: number;
  username: string;
  token?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const LS_KEY       = "auth_user";
const LS_TOKEN_KEY = "auth_token";
const DEV_BYPASS_TOKEN = "dev-bypass-token";
const DEV_BYPASS_USER: AuthUser = {
  created_at: "2026-05-11",
  email: "dev-test@local",
  full_name: "Dev Test Lecturer",
  is_active: 1,
  role: "LECTURER",
  uni_id: 1,
  user_id: 999,
  username: "DEV_TEST",
  token: DEV_BYPASS_TOKEN,
};

const normalizeRole = (value: string | undefined): UserRole => {
  const n = String(value || "").trim().toUpperCase();
  if (["LECTURER", "INSTRUCTOR", "TEACHER"].includes(n)) return "LECTURER";
  if (n === "ADMIN") return "ADMIN";
  return "STUDENT";
};

const normalizeUser = (user: AuthUser): AuthUser => ({
  ...user,
  role: normalizeRole(user.role),
});

const AUTH_EXPIRED_EVENT = "auth:expired";

const getInitialUser = (): AuthUser | null => {
  // IMPORTANT (SSR/hydration): Client Components may be pre-rendered on the server.
  // Reading `localStorage` here would render different HTML on server vs client and
  // cause hydration mismatch. We load from localStorage in a client-only effect.
  if (DEV_AUTH_BYPASS) return DEV_BYPASS_USER;
  return null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getInitialUser);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (DEV_AUTH_BYPASS) {
      localStorage.setItem(LS_KEY, JSON.stringify(DEV_BYPASS_USER));
      localStorage.setItem(LS_TOKEN_KEY, DEV_BYPASS_TOKEN);
      setUser(DEV_BYPASS_USER);
      setIsReady(true);
      return;
    }

    try {
      const raw = localStorage.getItem(LS_KEY);
      const parsed = raw ? (JSON.parse(raw) as AuthUser) : null;
      setUser(parsed ? normalizeUser(parsed) : null);
    } catch {
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_TOKEN_KEY);
      setUser(null);
    } finally {
      setIsReady(true);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await postJson<{
      success: boolean;
      data?: { user?: AuthUser; token?: string; token_type?: string };
      message?: string;
      error?: string;
    }>(`${PUBLIC_API_BASE_URL}auth/login`, { email, password });

    const u     = res.data?.user;
    const token = res.data?.token;
    if (!res.success || !u) {
      throw new Error(res.message || res.error || "Đăng nhập thất bại");
    }

    const normalizedUser = normalizeUser({ ...u, token });
    setUser(normalizedUser);
    localStorage.setItem(LS_KEY, JSON.stringify(normalizedUser));
    if (token) localStorage.setItem(LS_TOKEN_KEY, token);

    return normalizedUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_TOKEN_KEY);
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  };

  return (
    <AuthContext.Provider value={{ user, isReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải dùng bên trong AuthProvider");
  return ctx;
};
