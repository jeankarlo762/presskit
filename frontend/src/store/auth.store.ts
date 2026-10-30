import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AccountType, PlanKey, UserRole } from "@presskit/shared";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  planKey: PlanKey;
  role: UserRole;
  /** ARTIST (one page) or AGENCY (own page + roster of artist pages). */
  accountType?: AccountType;
  /** ISO date while the free PRO trial runs, else null. */
  trialEndsAt?: string | null;
};

type Session = { user: AuthUser; accessToken: string; refreshToken: string };

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** While a superadmin is "Entrar como usuário", their own session waits
   * here and the fields above hold the user's. */
  impersonator: Session | null;
  setSession: (session: Session) => void;
  /** Switches to `session`, keeping the current (admin) one aside. */
  startImpersonation: (session: Session) => void;
  /** Puts the admin session back; returns the user session to revoke. */
  stopImpersonation: () => string | null;
  /** Refreshes just the profile (role/plan can change server-side without
   * a new login — e.g. after being promoted to superadmin). */
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      impersonator: null,
      setSession: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      startImpersonation: (session) => {
        const { user, accessToken, refreshToken, impersonator } = get();
        const admin = impersonator ?? (user && accessToken && refreshToken ? { user, accessToken, refreshToken } : null);
        set({ ...session, impersonator: admin });
      },
      stopImpersonation: () => {
        const { impersonator, refreshToken } = get();
        if (!impersonator) return null;
        set({ ...impersonator, impersonator: null });
        return refreshToken;
      },
      setUser: (user) => set({ user }),
      clearSession: () => set({ user: null, accessToken: null, refreshToken: null, impersonator: null }),
    }),
    { name: "presskit-auth" },
  ),
);

export function isAgency(user: AuthUser | null | undefined) {
  return user?.accountType === "AGENCY";
}

export function isSuperadmin(user: AuthUser | null | undefined) {
  return user?.role === "SUPERADMIN";
}

/** Where to land right after signup/login: superadmins go straight to the
 * admin panel; everyone else to onboarding (new account) or the dashboard. */
export function postLoginPath(user: AuthUser, isNewUser = false) {
  if (isSuperadmin(user)) return "/admin";
  return isNewUser ? "/onboarding" : "/";
}
