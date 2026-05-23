export const LIBRARY_KEY = "tachiyul:library:v1";
export const PROGRESS_KEY = "tachiyul:progress:v1";
export const SETTINGS_KEY = "tachiyul:settings:v1";

export function mangaKey(sourceId: string, mangaId: string): string {
  return `${sourceId}:${mangaId}`;
}
