import * as cheerio from "cheerio";
import type {
  Chapter,
  MangaDetail,
  MangaSource,
  MangaSummary,
  PageList,
  Paginated,
} from "@/lib/sources/types";
import { fetchHtml, tryFetchHtml } from "@/lib/sources/http";

const BASE = "https://mangadna.com";

function absUrl(url: string): string {
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${BASE}${url}`;
  return url;
}

function parseMangaList(html: string): MangaSummary[] {
  const $ = cheerio.load(html);
  const out: MangaSummary[] = [];
  const seen = new Set<string>();

  $("a[href^='/manga/']").each((_, a) => {
    const href = $(a).attr("href") ?? "";
    const m = href.match(/^\/manga\/([^/?#]+)(?:\/chapter-[^/?#]+)?$/);
    if (!m) return;
    if (href.includes("/chapter-")) return;
    const id = m[1];
    if (seen.has(id)) return;

    const img = $(a).find("img").first();
    const cover = img.attr("src") ?? img.attr("data-src") ?? null;
    const title =
      img.attr("alt")?.trim() ||
      $(a).attr("title")?.trim() ||
      $(a).text().trim() ||
      id.replace(/-/g, " ");

    if (!title) return;
    seen.add(id);
    out.push({
      sourceId: "mangadna",
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

export const mangadna: MangaSource = {
  id: "mangadna",
  name: "MangaDNA",
  languages: ["en"],

  async search(query, opts) {
    const limit = opts?.limit ?? 30;
    const html = await fetchHtml(
      `${BASE}/search?q=${encodeURIComponent(query)}`,
    );
    return paginate(parseMangaList(html).slice(0, limit));
  },

  async popular(opts) {
    const limit = opts?.limit ?? 24;
    const html = await tryFetchHtml([
      `${BASE}/manga-list/all/all/popular/1`,
      `${BASE}/popular`,
      `${BASE}/`,
    ]);
    return paginate(parseMangaList(html).slice(0, limit));
  },

  async latest(opts) {
    const limit = opts?.limit ?? 24;
    const html = await tryFetchHtml([
      `${BASE}/manga-list/all/all/latest/1`,
      `${BASE}/latest`,
      `${BASE}/`,
    ]);
    return paginate(parseMangaList(html).slice(0, limit));
  },

  async getManga(mangaId): Promise<MangaDetail> {
    const html = await fetchHtml(`${BASE}/manga/${mangaId}`);
    const $ = cheerio.load(html);
    const title =
      $("h1, .manga-info h1, .seriestitle").first().text().trim() ||
      $("meta[property='og:title']").attr("content") ||
      mangaId.replace(/-/g, " ");
    const coverUrl =
      $(".manga-info img, .seriescover img, img.cover").first().attr("src") ??
      $("meta[property='og:image']").attr("content") ??
      null;
    const description =
      $(".description, .summary, .seriessummary p").first().text().trim() ||
      $("meta[property='og:description']").attr("content") ||
      "";

    const tags: string[] = [];
    $("a[href*='/genre/'], a[href*='/manga-genre/']").each((_, el) => {
      const t = $(el).text().trim();
      if (t) tags.push(t);
    });

    const authors: string[] = [];
    $("a[href*='/author/'], .author a").each((_, el) => {
      const t = $(el).text().trim();
      if (t) authors.push(t);
    });

    let status = "unknown";
    $("td, span, li, div").each((_, el) => {
      const t = $(el).text().trim();
      if (/^Status\s*[:\-]\s*(Ongoing|Completed|Hiatus)/i.test(t)) {
        status = t.replace(/^Status\s*[:\-]\s*/i, "").toLowerCase();
      }
    });

    return {
      sourceId: "mangadna",
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
    const html = await fetchHtml(`${BASE}/manga/${mangaId}`);
    const $ = cheerio.load(html);
    const out: Chapter[] = [];
    const seen = new Set<string>();

    $(`a[href*='/manga/${mangaId}/chapter-']`).each((_, a) => {
      const href = $(a).attr("href") ?? "";
      const m = href.match(/\/chapter-([\d.]+)/);
      if (!m) return;
      const number = m[1];
      const id = `${mangaId}__${number}`;
      if (seen.has(id)) return;
      seen.add(id);
      const dateText = $(a).find(".date, time, .chapter-time").first().text().trim();
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

    const order = opts?.order ?? "asc";
    out.sort((a, b) => {
      const an = a.number ? parseFloat(a.number) : Number.POSITIVE_INFINITY;
      const bn = b.number ? parseFloat(b.number) : Number.POSITIVE_INFINITY;
      return order === "asc" ? an - bn : bn - an;
    });

    return paginate(out);
  },

  async getPages(chapterId): Promise<PageList> {
    const sep = chapterId.lastIndexOf("__");
    if (sep < 0) return { chapterId, urls: [] };
    const slug = chapterId.slice(0, sep);
    const number = chapterId.slice(sep + 2);
    const html = await fetchHtml(`${BASE}/manga/${slug}/chapter-${number}`);
    const $ = cheerio.load(html);

    const urls: string[] = [];
    $(".read-content img.myx01, .read-content img[data-src], .read-manga img[data-src]").each(
      (_, img) => {
        const src = $(img).attr("data-src") ?? $(img).attr("src");
        if (src && /\.(jpe?g|png|webp)/i.test(src)) urls.push(src);
      },
    );

    if (urls.length === 0) {
      $("img").each((_, img) => {
        const src = $(img).attr("data-src") ?? $(img).attr("src");
        if (!src) return;
        if (!/\.(jpe?g|png|webp)/i.test(src)) return;
        if (src.includes("cdn") && src.includes("mangadna.com")) {
          urls.push(src);
        }
      });
    }

    return { chapterId, urls: Array.from(new Set(urls)) };
  },
};
