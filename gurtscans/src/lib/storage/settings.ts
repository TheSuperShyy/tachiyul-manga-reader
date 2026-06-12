"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SETTINGS_KEY } from "./keys";

export type ReaderMode = "paginated" | "strip";
export type ReadingDirection = "ltr" | "rtl";

export interface ReaderSettings {
  mode: ReaderMode;
  direction: ReadingDirection;
  preloadCount: number;
  fitWidth: boolean;
}

interface SettingsState extends ReaderSettings {
  set: (patch: Partial<ReaderSettings>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      mode: "paginated",
      direction: "ltr",
      preloadCount: 3,
      fitWidth: true,
      set: (patch) => set((s) => ({ ...s, ...patch })),
    }),
    {
      name: SETTINGS_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
