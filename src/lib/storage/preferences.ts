"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const PREFS_KEY = "tachiyul:prefs:v1";

interface PrefsState {
  activeSourceId: string;
  setActiveSourceId: (id: string) => void;
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      activeSourceId: "mangadex",
      setActiveSourceId: (id) => set({ activeSourceId: id }),
    }),
    {
      name: PREFS_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
