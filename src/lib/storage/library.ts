"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { LIBRARY_KEY, mangaKey } from "./keys";

export interface LibraryEntry {
  sourceId: string;
  mangaId: string;
  title: string;
  coverUrl: string | null;
  addedAt: number;
}

interface LibraryState {
  entries: Record<string, LibraryEntry>;
  add: (entry: Omit<LibraryEntry, "addedAt">) => void;
  remove: (sourceId: string, mangaId: string) => void;
  toggle: (entry: Omit<LibraryEntry, "addedAt">) => void;
  has: (sourceId: string, mangaId: string) => boolean;
  list: () => LibraryEntry[];
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      entries: {},
      add: (entry) =>
        set((s) => ({
          entries: {
            ...s.entries,
            [mangaKey(entry.sourceId, entry.mangaId)]: {
              ...entry,
              addedAt: Date.now(),
            },
          },
        })),
      remove: (sourceId, mangaId) =>
        set((s) => {
          const next = { ...s.entries };
          delete next[mangaKey(sourceId, mangaId)];
          return { entries: next };
        }),
      toggle: (entry) => {
        const key = mangaKey(entry.sourceId, entry.mangaId);
        if (get().entries[key]) get().remove(entry.sourceId, entry.mangaId);
        else get().add(entry);
      },
      has: (sourceId, mangaId) =>
        !!get().entries[mangaKey(sourceId, mangaId)],
      list: () =>
        Object.values(get().entries).sort((a, b) => b.addedAt - a.addedAt),
    }),
    {
      name: LIBRARY_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
