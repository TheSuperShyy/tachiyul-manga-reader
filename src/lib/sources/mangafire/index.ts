import * as cheerio from "cheerio";
import type {
  Chapter,
  MangaDetail,
  MangaSource,
  MangaSummary,
  PageList,
  Paginated,
} from "@/lib/sources/types";
import { fetchHtml, fetchJson, tryFetchHtml } from "@/lib/sources/http";

const BASE = "https://mangafire.to";

function absUrl(url: string): string {
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${BASE}${url}`;
  return url;
}

function parseMangaCards(html: string): MangaSummary[] {
  const $ = cheerio.load(html);
  const out: MangaSummary[] = [];
  const seen = new Set<string>();

  $("a[href^='/manga/']").each((_, a) => {
    const href = $(a).attr("href") ?? "";
    const m = href.match(/^\/manga\/([^/?#]+)/);
    if (!m) return;
    const id = m[1];
    if (seen.has(id)) return;

    const img = $(a).find("img").first();
    const cover = img.attr("src") ?? img.attr("data-src") ?? null;
    const title =
      $(a).attr("title")?.trim() ||
      img.attr("alt")?.trim() ||
      $(a).find(".name, h3, h4").first().text().trim() ||
      $(a).text().trim() ||
      id.replace(/\..*$/, "").replace(/-/g, " ");

    if (!title) return;
    seen.add(id);
    out.push({
      sourceId: "mangafire",
      id,
      title,
      coverUrl: cover ? absUrl(cover) : null,
    });
  });
  return out;
}

function paginate<T>(items: T[]): Paginated<T> {
  return { items, total: items.length, offset: 0, limit: items.length };
}

export const mangafire: MangaSource = {
  id: "mangafire",
  name: "MangaFire",
  languages: ["en"],

  async search(query, opts) {
    const limit = opts?.limit ?? 30;
    const html = await tryFetchHtml([
      `${BASE}/filter?keyword=${encodeURIComponent(query)}&language%5B%5D=en`,
      `${BASE}/search?keyword=${encodeURIComponent(query)}`,
    ]);
    return paginate(parseMangaCards(html).slice(0, limit));
  },

  async popular(opts) {
    const limit = opts?.limit ?? 24;
    const html = await tryFetchHtml([
      `${BASE}/filter?sort=most_viewed&language%5B%5D=en`,
      `${BASE}/popular`,
      `${BASE}/home`,
      `${BASE}/`,
    ]);
    return paginate(parseMangaCards(html).slice(0, limit));
  },

  async latest(opts) {
    const limit = opts?.limit ?? 24;
    const html = await tryFetchHtml([
      `${BASE}/filter?sort=recently_updated&language%5B%5D=en`,
      `${BASE}/updated`,
      `${BASE}/`,
    ]);
    return paginate(parseMangaCards(html).slice(0, limit));
  },

  async getManga(mangaId): Promise<MangaDetail> {
    const html = await fetchHtml(`${BASE}/manga/${mangaId}`);
    const $ = cheerio.load(html);
    const title =
      $("h1, .info h1, .name").first().text().trim() ||
      $("meta[property='og:title']").attr("content") ||
      mangaId.replace(/\..*$/, "").replace(/-/g, " ");
    const coverUrl =
      $(".poster img, .cover img, img.cover").first().attr("src") ??
      $("meta[property='og:image']").attr("content") ??
      null;
    const description =
      $("#synopsis, .description, .summary").first().text().trim() ||
      $("meta[property='og:description']").attr("content") ||
      "";

    const tags: string[] = [];
    $("a[href*='/genre/'], .genres a").each((_, el) => {
      const t = $(el).text().trim();
      if (t) tags.push(t);
    });

    const authors: string[] = [];
    $("a[href*='/author/'], .author a, .meta .author").each((_, el) => {
      const t = $(el).text().trim();
      if (t) authors.push(t);
    });

    let status = "unknown";
    $("span, p, div").each((_, el) => {
      const t = $(el).text().trim().toLowerCase();
      if (t === "ongoing" || t === "completed" || t === "hiatus") status = t;
    });

    return {
      sourceId: "mangafire",
      id: mangaId,
      title,
      coverUrl: coverUrl ? absUrl(coverUrl) : null,
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

  async getChapters(mangaId, opts): Promise<Paginated<Chapter>> {
    let chapters: Chapter[] = [];
    const idMatch = mangaId.match(/\.([a-z0-9]+)$/);
    const numericId = idMatch ? idMatch[1] : null;

    if (numericId) {
      try {
        const data = await fetchJson<{ result?: { html?: string } }>(
          `${BASE}/ajax/read/${numericId}/chapter/en`,
          { headers: { "X-Requested-With": "XMLHttpRequest", Referer: `${BASE}/manga/${mangaId}` } },
        );
        const html = data.result?.html ?? "";
        if (html) {
          const $ = cheerio.load(html);
          $("a").each((_, a) => {
            const href = $(a).attr("href") ?? "";
            const dataId = $(a).attr("data-id") ?? "";
            const num = $(a).attr("data-number") ?? "";
            if (!dataId && !href) return;
            const id = dataId || href;
            const text = $(a).text().trim();
            chapters.push({
              id,
              number: num || text.match(/[\d.]+/)?.[0] || null,
              volume: null,
              title: text || null,
              lang: "en",
              publishedAt: new Date().toISOString(),
              pages: 0,
              groupName: null,
            });
          });
        }
      } catch {
        /* fall through */
      }
    }

    if (chapters.length === 0) {
      const html = await fetchHtml(`${BASE}/manga/${mangaId}`);
      const $ = cheerio.load(html);
      $(`a[href*='/read/']`).each((_, a) => {
        const href = $(a).attr("href") ?? "";
        const m = href.match(/\/read\/[^/]+\/[^/]+\/chapter-([\d.]+)/);
        if (!m) return;
        const number = m[1];
        const id = href;
        chapters.push({
          id,
          number,
          volume: null,
          title: null,
          lang: "en",
          publishedAt: new Date().toISOString(),
          pages: 0,
          groupName: null,
        });
      });
    }

    const seen = new Set<string>();
    chapters = chapters.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });

    const order = opts?.order ?? "asc";
    chapters.sort((a, b) => {
      const an = a.number ? parseFloat(a.number) : Number.POSITIVE_INFINITY;
      const bn = b.number ? parseFloat(b.number) : Number.POSITIVE_INFINITY;
      return order === "asc" ? an - bn : bn - an;
    });

    return paginate(chapters);
  },

  async getPages(chapterId): Promise<PageList> {
    try {
      const data = await fetchJson<{ result?: { images?: [string, ...unknown[]][] } }>(
        `${BASE}/ajax/read/chapter/${chapterId}`,
        { headers: { "X-Requested-With": "XMLHttpRequest" } },
      );
      const images = data.result?.images ?? [];
      const urls = images
        .map((entry) => (Array.isArray(entry) ? entry[0] : entry))
        .filter((u): u is string => typeof u === "string");
      return { chapterId, urls };
    } catch {
      /* fall through to HTML fallback */
    }

    const html = await fetchHtml(`${chapterId.startsWith("http") ? chapterId : BASE + chapterId}`);
    const $ = cheerio.load(html);
    const urls: string[] = [];
    $("img").each((_, img) => {
      const src = $(img).attr("src") ?? $(img).attr("data-src");
      if (src && /\.(jpe?g|png|webp)/i.test(src) && !src.includes("logo") && !src.includes("avatar")) {
        urls.push(src);
      }
    });
    return { chapterId, urls };
  },
};
