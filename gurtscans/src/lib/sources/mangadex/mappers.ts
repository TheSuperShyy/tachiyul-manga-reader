import type {
  Chapter,
  MangaDetail,
  MangaSummary,
} from "@/lib/sources/types";

const UPLOADS = "https://uploads.mangadex.org";

type Relationship = {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
};

type LocalizedString = Record<string, string>;

type MangaAttrs = {
  title: LocalizedString;
  altTitles: LocalizedString[];
  description: LocalizedString;
  originalLanguage: string;
  status: string;
  year: number | null;
  tags: { attributes: { name: LocalizedString } }[];
};

export type MdMangaApi = {
  id: string;
  type: "manga";
  attributes: MangaAttrs;
  relationships: Relationship[];
};

export type MdChapterApi = {
  id: string;
  type: "chapter";
  attributes: {
    title: string | null;
    chapter: string | null;
    volume: string | null;
    translatedLanguage: string;
    publishAt: string;
    pages: number;
  };
  relationships: Relationship[];
};

export type MdAtHomeResponse = {
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
};

function pickTitle(t: LocalizedString): string {
  return t.en ?? t["en-us"] ?? Object.values(t)[0] ?? "Untitled";
}

function pickDescription(d: LocalizedString | undefined): string {
  if (!d) return "";
  return d.en ?? d["en-us"] ?? Object.values(d)[0] ?? "";
}

function coverUrl(mangaId: string, rels: Relationship[]): string | null {
  const cover = rels.find((r) => r.type === "cover_art");
  const file = cover?.attributes?.fileName as string | undefined;
  if (!file) return null;
  return `${UPLOADS}/covers/${mangaId}/${file}.512.jpg`;
}

function relAttr(rels: Relationship[], type: string, attr: string): string[] {
  return rels
    .filter((r) => r.type === type)
    .map((r) => (r.attributes?.[attr] as LocalizedString | string | undefined))
    .map((v) => (typeof v === "string" ? v : v ? pickTitle(v) : null))
    .filter((v): v is string => !!v);
}

export function toSummary(m: MdMangaApi): MangaSummary {
  return {
    sourceId: "mangadex",
    id: m.id,
    title: pickTitle(m.attributes.title),
    coverUrl: coverUrl(m.id, m.relationships),
  };
}

export function toDetail(m: MdMangaApi): MangaDetail {
  const summary = toSummary(m);
  return {
    ...summary,
    description: pickDescription(m.attributes.description),
    tags: m.attributes.tags.map((t) => pickTitle(t.attributes.name)),
    status: m.attributes.status,
    authors: relAttr(m.relationships, "author", "name"),
    artists: relAttr(m.relationships, "artist", "name"),
    originalLanguage: m.attributes.originalLanguage,
    year: m.attributes.year,
    altTitles: m.attributes.altTitles
      .map((t) => Object.values(t)[0])
      .filter(Boolean),
  };
}

export function toChapter(c: MdChapterApi): Chapter {
  const group = c.relationships.find((r) => r.type === "scanlation_group");
  return {
    id: c.id,
    number: c.attributes.chapter,
    volume: c.attributes.volume,
    title: c.attributes.title,
    lang: c.attributes.translatedLanguage,
    publishedAt: c.attributes.publishAt,
    pages: c.attributes.pages,
    groupName: (group?.attributes?.name as string | undefined) ?? null,
  };
}

export function atHomeToUrls(r: MdAtHomeResponse): string[] {
  const urls = r.chapter.data.map(
    (file) => `${r.baseUrl}/data/${r.chapter.hash}/${file}`,
  );
  
  // Filter out potential credit pages and ads at the end
  // Scanlation groups often add credit pages, ads, or promotional content
  // at the end of chapters. We'll remove the last 2 images if there are more than 5 pages.
  if (urls.length > 5) {
    return urls.slice(0, -2);
  }
  
  return urls;
}
