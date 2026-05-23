"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { PROGRESS_KEY, mangaKey } from "./keys";

export interface ProgressEntry {
  chapterId: string;
  page: number;
  totalPages: number;
  updatedAt: number;
}

interface ProgressState {
  entries: Record<string, ProgressEntry>;
  set: (
    sourceId: string,
    mangaId: string,
    update: Omit<ProgressEntry, "updatedAt">,
  ) => void;
  get: (sourceId: string, mangaId: string) => ProgressEntry | undefined;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      entries: {},
      set: (sourceId, mangaId, update) =>
        set((s) => ({
          entries: {
            ...s.entries,
            [mangaKey(sourceId, mangaId)]: {
              ...update,
              updatedAt: Date.now(),
            },
          },
        })),
      get: (sourceId, mangaId) => get().entries[mangaKey(sourceId, mangaId)],
    }),
    {
      name: PROGRESS_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
