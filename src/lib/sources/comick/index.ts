import type {
  Chapter,
  MangaDetail,
  MangaSource,
  MangaSummary,
  PageList,
  Paginated,
} from "@/lib/sources/types";
import { fetchJson } from "@/lib/sources/http";

const API = "https://api.comick.dev";
const IMG = "https://meo.comick.pictures";
const HEADERS: Record<string, string> = {
  Origin: "https://comick.dev",
  Referer: "https://comick.dev/",
  "Accept-Language": "en-US,en;q=0.9",
  "sec-ch-ua":
    '"Not_A Brand";v="8", "Chromium";v="124", "Google Chrome";v="124"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
};

async function api<T>(path: string): Promise<T> {
  return fetchJson<T>(`${API}${path}`, { headers: HEADERS });
}

interface SearchItemApi {
  id: number;
  hid: string;
  slug: string;
  title: string;
  md_titles?: { title: string }[];
  md_covers?: { b2key: string }[];
  cover_url?: string;
}

interface ComicDetailApi {
  comic: {
    id: number;
    hid: string;
    slug: string;
    title: string;
    desc?: string;
    status?: number;
    year?: number;
    country?: string;
    md_titles?: { title: string; lang?: string }[];
    md_covers?: { b2key: string }[];
    md_comic_md_genres?: { md_genres: { name: string } }[];
  };
  authors?: { name: string }[];
  artists?: { name: string }[];
  firstChap?: { hid: string; chap: string } | null;
}

interface ChapterListApi {
  chapters: ChapterApi[];
  total?: number;
}

interface ChapterApi {
  hid: string;
  chap: string | null;
  vol: string | null;
  title: string | null;
  lang: string;
  created_at: string;
  group_name?: string[];
  publish_at?: string;
  up_count?: number;
  down_count?: number;
}

interface ChapterDetailApi {
  chapter: {
    hid: string;
    chap: string | null;
    md_images?: { b2key: string; w?: number; h?: number }[];
  };
}

function coverFrom(item: { md_covers?: { b2key: string }[]; cover_url?: string }): string | null {
  const b2 = item.md_covers?.[0]?.b2key;
  if (b2) return `${IMG}/${b2}`;
  if (item.cover_url) return item.cover_url;
  return null;
}

function statusFromCode(s?: number): string {
  switch (s) {
    case 1:
      return "ongoing";
    case 2:
      return "completed";
    case 3:
      return "cancelled";
    case 4:
      return "hiatus";
    default:
      return "unknown";
  }
}

function paginate<T>(items: T[]): Paginated<T> {
  return { items, total: items.length, offset: 0, limit: items.length };
}

export const comick: MangaSource = {
  id: "comick",
  name: "Comick",
  languages: ["en"],

  async search(query, opts) {
    const limit = opts?.limit ?? 30;
    const res = await api<SearchItemApi[]>(
      `/v1.0/search?q=${encodeURIComponent(query)}&limit=${limit}&type=comic`,
    );
    const items: MangaSummary[] = res.map((c) => ({
      sourceId: "comick",
      id: c.slug,
      title: c.title,
      coverUrl: coverFrom(c),
    }));
    return paginate(items);
  },

  async popular(opts) {
    const limit = opts?.limit ?? 24;
    const res = await api<SearchItemApi[]>(
      `/v1.0/search?sort=follow&limit=${limit}&type=comic&page=1`,
    );
    return paginate(
      res.map((c) => ({
        sourceId: "comick",
        id: c.slug,
        title: c.title,
        coverUrl: coverFrom(c),
      })),
    );
  },

  async latest(opts) {
    const limit = opts?.limit ?? 24;
    const res = await api<SearchItemApi[]>(
      `/v1.0/search?sort=uploaded&limit=${limit}&type=comic&page=1`,
    );
    return paginate(
      res.map((c) => ({
        sourceId: "comick",
        id: c.slug,
        title: c.title,
        coverUrl: coverFrom(c),
      })),
    );
  },

  async getManga(mangaId): Promise<MangaDetail> {
    const res = await api<ComicDetailApi>(
      `/comic/${mangaId}?tachiyomi=true`,
    );
    const c = res.comic;
    const altTitles = (c.md_titles ?? [])
      .map((t) => t.title)
      .filter((t) => t && t !== c.title);
    return {
      sourceId: "comick",
      id: c.slug,
      title: c.title,
      coverUrl: coverFrom(c),
      description: c.desc ?? "",
      tags: (c.md_comic_md_genres ?? []).map((g) => g.md_genres.name),
      status: statusFromCode(c.status),
      authors: (res.authors ?? []).map((a) => a.name),
      artists: (res.artists ?? []).map((a) => a.name),
      originalLanguage: c.country ?? "",
      year: c.year ?? null,
      altTitles: Array.from(new Set(altTitles)),
    };
  },

  async getChapters(mangaId, opts): Promise<Paginated<Chapter>> {
    const order = opts?.order ?? "asc";
    let page = 1;
    const all: ChapterApi[] = [];
    while (page < 20) {
      const res = await api<ChapterListApi>(
        `/comic/${mangaId}/chapters?lang=en&limit=200&page=${page}&chap-order=${order === "asc" ? 1 : 0}`,
      );
      if (!res.chapters || res.chapters.length === 0) break;
      all.push(...res.chapters);
      if (res.chapters.length < 200) break;
      page++;
    }

    const byChap = new Map<string, Chapter>();
    for (const ch of all) {
      const number = ch.chap;
      const key = number ?? `__no_num__:${ch.hid}`;
      const mapped: Chapter = {
        id: ch.hid,
        number,
        volume: ch.vol,
        title: ch.title,
        lang: ch.lang,
        publishedAt: ch.publish_at ?? ch.created_at,
        pages: 0,
        groupName: ch.group_name?.[0] ?? null,
      };
      const existing = byChap.get(key);
      if (!existing) {
        byChap.set(key, mapped);
      } else if ((ch.up_count ?? 0) > 0 || !existing.groupName) {
        byChap.set(key, mapped);
      }
    }

    const deduped = Array.from(byChap.values()).sort((a, b) => {
      const an = a.number ? parseFloat(a.number) : Number.POSITIVE_INFINITY;
      const bn = b.number ? parseFloat(b.number) : Number.POSITIVE_INFINITY;
      if (Number.isNaN(an) && Number.isNaN(bn)) return 0;
      if (Number.isNaN(an)) return 1;
      if (Number.isNaN(bn)) return -1;
      return order === "asc" ? an - bn : bn - an;
    });

    return paginate(deduped);
  },

  async getPages(chapterId): Promise<PageList> {
    const res = await api<ChapterDetailApi>(
      `/chapter/${chapterId}?tachiyomi=true`,
    );
    const images = res.chapter.md_images ?? [];
    return {
      chapterId,
      urls: images.map((img) => `${IMG}/${img.b2key}`),
    };
  },
};
