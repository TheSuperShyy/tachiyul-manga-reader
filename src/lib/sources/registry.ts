import type { MangaSource } from "./types";
import { mangadex } from "./mangadex";
import { weebcentral } from "./weebcentral";
import { asura } from "./asura";

const sources: Record<string, MangaSource> = {
  [mangadex.id]: mangadex,
  [weebcentral.id]: weebcentral,
  [asura.id]: asura,
};

export function getSource(id: string): MangaSource {
  const source = sources[id];
  if (!source) throw new Error(`Unknown source: ${id}`);
  return source;
}

export function listSources(): MangaSource[] {
  return Object.values(sources);
}

export const DEFAULT_SOURCE_ID = mangadex.id;
