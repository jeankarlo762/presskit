import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Which of the account's pages the dashboard is editing. Artists have one
 * page and never touch this; agencies switch between their own page and
 * each artist's. The id travels as `X-Presskit-Id` on every API call (see
 * api/axios.ts) and the server still checks ownership.
 */
type PresskitState = {
  activePresskitId: string | null;
  setActivePresskitId: (id: string | null) => void;
};

export const usePresskitStore = create<PresskitState>()(
  persist(
    (set) => ({
      activePresskitId: null,
      setActivePresskitId: (activePresskitId) => set({ activePresskitId }),
    }),
    { name: "presskit-active" },
  ),
);
