"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  fetchMe,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
  type SiteUser,
} from "../../lib/auth-client";
import { LoginModal } from "./LoginModal";

const STORAGE_KEY = "presskit-site-auth";

type StoredTokens = { accessToken: string; refreshToken: string };

type Status = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: Status;
  user: SiteUser | null;
  loginError: string | null;
  loginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredTokens(): StoredTokens | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredTokens) : null;
  } catch {
    return null;
  }
}

function writeStoredTokens(tokens: StoredTokens | null) {
  try {
    if (tokens) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sem storage disponível (modo privado etc.) — sessão só dura a aba atual.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<SiteUser | null>(null);
  const [tokens, setTokens] = useState<StoredTokens | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    async function restoreSession() {
      const stored = readStoredTokens();
      if (!stored) {
        setStatus("anonymous");
        return;
      }

      try {
        const { user: me } = await fetchMe(stored.accessToken);
        setUser(me);
        setTokens(stored);
        setStatus("authenticated");
      } catch {
        try {
          const refreshed = await refreshSession(stored.refreshToken);
          setUser(refreshed.user);
          setTokens({ accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken });
          writeStoredTokens({ accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken });
          setStatus("authenticated");
        } catch {
          writeStoredTokens(null);
          setStatus("anonymous");
        }
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoginError(null);
    try {
      const result = await loginRequest(email, password);
      setUser(result.user);
      const nextTokens = { accessToken: result.accessToken, refreshToken: result.refreshToken };
      setTokens(nextTokens);
      writeStoredTokens(nextTokens);
      setStatus("authenticated");
      setLoginModalOpen(false);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Não foi possível entrar");
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    if (tokens) logoutRequest(tokens.refreshToken);
    setUser(null);
    setTokens(null);
    writeStoredTokens(null);
    setStatus("anonymous");
  }, [tokens]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      loginError,
      loginModalOpen,
      openLoginModal: () => {
        setLoginError(null);
        setLoginModalOpen(true);
      },
      closeLoginModal: () => setLoginModalOpen(false),
      login,
      logout,
    }),
    [status, user, loginError, loginModalOpen, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
