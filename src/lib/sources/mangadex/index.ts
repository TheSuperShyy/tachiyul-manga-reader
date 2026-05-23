import type {
  Chapter,
  ChapterOpts,
  ListOpts,
  MangaDetail,
  MangaSource,
  MangaSummary,
  PageList,
  Paginated,
  SearchOpts,
} from "@/lib/sources/types";
import { mdFetch } from "./client";
import {
  atHomeToUrls,
  toChapter,
  toDetail,
  toSummary,
  type MdAtHomeResponse,
  type MdChapterApi,
  type MdMangaApi,
} from "./mappers";

type MangaListRes = {
  data: MdMangaApi[];
  total: number;
  offset: number;
  limit: number;
};

type MangaRes = { data: MdMangaApi };

type ChapterListRes = {
  data: MdChapterApi[];
  total: number;
  offset: number;
  limit: number;
};

const DEFAULT_CONTENT = ["safe", "suggestive"];
const DEFAULT_LANGS = ["en"];

function listOpts(opts?: ListOpts) {
  return { limit: opts?.limit ?? 24, offset: opts?.offset ?? 0 };
}

export const mangadex: MangaSource = {
  id: "mangadex",
  name: "MangaDex",
  languages: ["en", "ja", "ko", "zh"],

  async search(query, opts) {
    const { limit, offset } = listOpts(opts);
    const res = await mdFetch<MangaListRes>("/manga", {
      title: query,
      limit,
      offset,
      "includes[]": ["cover_art", "author", "artist"],
      "contentRating[]": DEFAULT_CONTENT,
      "order[relevance]": "desc",
    });
    return paginate(res.data.map(toSummary), res);
  },

  async popular(opts) {
    const { limit, offset } = listOpts(opts);
    const res = await mdFetch<MangaListRes>("/manga", {
      limit,
      offset,
      "includes[]": ["cover_art"],
      "contentRating[]": DEFAULT_CONTENT,
      "order[followedCount]": "desc",
      hasAvailableChapters: true,
    });
    return paginate(res.data.map(toSummary), res);
  },

  async latest(opts) {
    const { limit, offset } = listOpts(opts);
    const res = await mdFetch<MangaListRes>("/manga", {
      limit,
      offset,
      "includes[]": ["cover_art"],
      "contentRating[]": DEFAULT_CONTENT,
      "order[latestUploadedChapter]": "desc",
      hasAvailableChapters: true,
    });
    return paginate(res.data.map(toSummary), res);
  },

  async getManga(mangaId): Promise<MangaDetail> {
    const res = await mdFetch<MangaRes>(`/manga/${mangaId}`, {
      "includes[]": ["cover_art", "author", "artist"],
    });
    return toDetail(res.data);
  },

  async getChapters(mangaId, opts): Promise<Paginated<Chapter>> {
    const order = opts?.order ?? "asc";
    const languages = opts?.languages ?? DEFAULT_LANGS;
    const pageSize = 500;
    const collected: MdChapterApi[] = [];
    let offset = 0;
    let total = 0;
    do {
      const res = await mdFetch<ChapterListRes>(`/manga/${mangaId}/feed`, {
        limit: pageSize,
        offset,
        "translatedLanguage[]": languages,
        "order[volume]": order,
        "order[chapter]": order,
        "includes[]": ["scanlation_group"],
        "contentRating[]": DEFAULT_CONTENT,
      });
      collected.push(...res.data);
      total = res.total;
      offset += res.data.length;
      if (res.data.length === 0) break;
    } while (offset < total && offset < 2000);

    const all = collected.map(toChapter).filter((c) => c.pages > 0);
    const byNumber = new Map<string, Chapter>();
    for (const ch of all) {
      const key = ch.number ?? `__no_num__:${ch.id}`;
      const existing = byNumber.get(key);
      if (!existing || ch.pages > existing.pages) byNumber.set(key, ch);
    }
    const deduped = Array.from(byNumber.values()).sort((a, b) => {
      const an = a.number != null ? parseFloat(a.number) : Number.POSITIVE_INFINITY;
      const bn = b.number != null ? parseFloat(b.number) : Number.POSITIVE_INFINITY;
      if (Number.isNaN(an) && Number.isNaN(bn)) return 0;
      if (Number.isNaN(an)) return 1;
      if (Number.isNaN(bn)) return -1;
      return order === "asc" ? an - bn : bn - an;
    });

    return {
      items: deduped,
      total: deduped.length,
      offset: 0,
      limit: deduped.length,
    };
  },

  async getPages(chapterId): Promise<PageList> {
    const res = await mdFetch<MdAtHomeResponse>(
      `/at-home/server/${chapterId}`,
    );
    return { chapterId, urls: atHomeToUrls(res) };
  },
};

function paginate<T>(
  items: T[],
  meta: { total: number; offset: number; limit: number },
): Paginated<T> {
  return {
    items,
    total: meta.total,
    offset: meta.offset,
    limit: meta.limit,
  };
}

export type { MangaSummary, MangaDetail, Chapter, PageList };
