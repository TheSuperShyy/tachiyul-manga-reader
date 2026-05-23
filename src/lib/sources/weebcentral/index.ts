import * as cheerio from "cheerio";
import type {
  Chapter,
  MangaDetail,
  MangaSource,
  MangaSummary,
  PageList,
  Paginated,
} from "@/lib/sources/types";
import { fetchHtml } from "@/lib/sources/http";

const BASE = "https://weebcentral.com";

function parseSeriesCards(html: string): MangaSummary[] {
  const $ = cheerio.load(html);
  const out: MangaSummary[] = [];
  const seen = new Set<string>();
  $("a[href*='/series/']").each((_, a) => {
    const href = $(a).attr("href") ?? "";
    const m = href.match(/\/series\/([A-Z0-9]+)(?:\/([^/?#]+))?/i);
    if (!m) return;
    const id = m[1];
    if (seen.has(id)) return;
    const img = $(a).find("img").first();
    const cover =
      img.attr("src") ??
      $(a).find("source").first().attr("srcset")?.split(/\s+/)[0] ??
      null;
    const title =
      $(a)
        .find(".text-ellipsis, .truncate.text-lg, .text-white.text-center")
        .first()
        .text()
        .trim() ||
      img.attr("alt")?.replace(/\s+cover$/i, "").trim() ||
      m[2]?.replace(/-/g, " ") ||
      "";
    if (!title) return;
    seen.add(id);
    out.push({ sourceId: "weebcentral", id, title, coverUrl: cover });
  });
  return out;
}

function paginate<T>(items: T[]): Paginated<T> {
  return { items, total: items.length, offset: 0, limit: items.length };
}

async function searchPath(
  text: string,
  sort: string,
  limit: number,
): Promise<MangaSummary[]> {
  const qs = new URLSearchParams({
    text,
    sort,
    order: "Descending",
    official: "Any",
    anime: "Any",
    adult: "Any",
    display_mode: "Full Display",
    limit: String(limit),
  });
  const html = await fetchHtml(`${BASE}/search/data?${qs.toString()}`, {
    headers: {
      "HX-Request": "true",
      Referer: `${BASE}/search`,
    },
  });
  return parseSeriesCards(html).slice(0, limit);
}

export const weebcentral: MangaSource = {
  id: "weebcentral",
  name: "WeebCentral",
  languages: ["en"],

  async search(query, opts) {
    const limit = opts?.limit ?? 30;
    return paginate(await searchPath(query, "Best Match", limit));
  },

  async popular(opts) {
    const limit = opts?.limit ?? 24;
    return paginate(await searchPath("", "Popularity", limit));
  },

  async latest(opts) {
    const limit = opts?.limit ?? 24;
    return paginate(await searchPath("", "Latest Updates", limit));
  },

  async getManga(mangaId): Promise<MangaDetail> {
    const html = await fetchHtml(`${BASE}/series/${mangaId}`);
    const $ = cheerio.load(html);
    const title =
      $("h1").first().text().trim() ||
      $("meta[property='og:title']").attr("content") ||
      "";
    const coverUrl =
      $("img[alt$='cover']").first().attr("src") ??
      $("section img").first().attr("src") ??
      $("meta[property='og:image']").attr("content") ??
      null;
    const description =
      $("p.whitespace-pre-wrap, .description p, p.line-clamp-3")
        .first()
        .text()
        .trim() ||
      $("meta[property='og:description']").attr("content") ||
      "";

    const tags: string[] = [];
    $("a[href*='included_tag='], a[href*='/tag/']").each((_, el) => {
      const t = $(el).text().trim();
      if (t) tags.push(t);
    });

    const authors: string[] = [];
    $("a[href*='author=']").each((_, el) => {
      const t = $(el).text().trim();
      if (t) authors.push(t);
    });

    let status = "unknown";
    $("span, strong, div").each((_, el) => {
      const t = $(el).text().trim().toLowerCase();
      if (
        t === "ongoing" ||
        t === "complete" ||
        t === "completed" ||
        t === "hiatus" ||
        t === "cancelled"
      ) {
        status = t;
      }
    });

    return {
      sourceId: "weebcentral",
      id: mangaId,
      title: title || "Untitled",
      coverUrl,
      description,
      tags: Array.from(new Set(tags)),
      status,
      authors: Array.from(new Set(authors)),
      artists: [],
      originalLanguage: "",
      year: null,
      altTitles: [],
    };
  },

  async getChapters(mangaId): Promise<Paginated<Chapter>> {
    const html = await fetchHtml(
      `${BASE}/series/${mangaId}/full-chapter-list`,
      {
        headers: {
          "HX-Request": "true",
          Referer: `${BASE}/series/${mangaId}`,
        },
      },
    );
    const $ = cheerio.load(html);

    const out: Chapter[] = [];
    $("a[href*='/chapters/']").each((_, a) => {
      const href = $(a).attr("href") ?? "";
      const idMatch = href.match(/\/chapters\/([A-Z0-9]+)/i);
      if (!idMatch) return;
      const id = idMatch[1];
      const text = $(a).text().trim();
      const numMatch = text.match(/chapter\s*([\d.]+)/i);
      const number = numMatch ? numMatch[1] : null;
      const dateText = $(a).find("time, .text-xs").first().text().trim();
      out.push({
        id,
        number,
        volume: null,
        title: null,
        lang: "en",
        publishedAt: dateText || new Date().toISOString(),
        pages: 0,
        groupName: null,
      });
    });

    const seen = new Set<string>();
    const deduped = out.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });

    deduped.sort((a, b) => {
      const an = a.number ? parseFloat(a.number) : Number.POSITIVE_INFINITY;
      const bn = b.number ? parseFloat(b.number) : Number.POSITIVE_INFINITY;
      if (Number.isNaN(an) && Number.isNaN(bn)) return 0;
      if (Number.isNaN(an)) return 1;
      if (Number.isNaN(bn)) return -1;
      return an - bn;
    });

    return paginate(deduped);
  },

  async getPages(chapterId): Promise<PageList> {
    const html = await fetchHtml(
      `${BASE}/chapters/${chapterId}/images?is_prev=False&reading_style=long_strip`,
      {
        headers: {
          "HX-Request": "true",
          Referer: `${BASE}/chapters/${chapterId}`,
        },
      },
    );
    const $ = cheerio.load(html);
    const urls: string[] = [];
    $("img").each((_, img) => {
      const src = $(img).attr("src");
      if (src && /\.(jpe?g|png|webp)/i.test(src)) urls.push(src);
    });
    return { chapterId, urls };
  },
};
