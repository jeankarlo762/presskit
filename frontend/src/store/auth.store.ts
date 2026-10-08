import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlanKey, UserRole } from "@presskit/shared";

export type AuthUser = { id: string; name: string; email: string; planKey: PlanKey; role: UserRole };

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (session: { user: AuthUser; accessToken: string; refreshToken: string }) => void;
  /** Refreshes just the profile (role/plan can change server-side without
   * a new login — e.g. after being promoted to superadmin). */
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      clearSession: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: "presskit-auth" },
  ),
);

export function isSuperadmin(user: AuthUser | null | undefined) {
  return user?.role === "SUPERADMIN";
}
