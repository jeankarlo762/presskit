import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = { id: string; name: string; email: string; planKey: "FREE" | "PRO"; avatarUrl: string | null };

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (session: { user: AuthUser; accessToken: string; refreshToken: string }) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      clearSession: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: "presskit-auth" },
  ),
);
