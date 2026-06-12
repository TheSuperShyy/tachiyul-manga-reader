export interface VisibleSource {
  id: string;
  name: string;
}

interface SourceMeta extends VisibleSource {
  hideOnVercel?: boolean;
}

const ALL: SourceMeta[] = [
  { id: "mangadex", name: "MangaDex" },
  { id: "asura", name: "AsuraScans" },
  { id: "mangadna", name: "MangaDNA" },
  { id: "weebcentral", name: "WeebCentral", hideOnVercel: true },
  { id: "mangafire", name: "MangaFire", hideOnVercel: true },
  { id: "mangakakalot", name: "MangaKakalot", hideOnVercel: true },
];

export function getVisibleSources(): VisibleSource[] {
  const isVercel = !!process.env.VERCEL;
  return ALL.filter((s) => !isVercel || !s.hideOnVercel).map(
    ({ id, name }) => ({ id, name }),
  );
}
