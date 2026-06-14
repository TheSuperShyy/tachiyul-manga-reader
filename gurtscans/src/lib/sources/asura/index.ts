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

const BASE = "https://asurascans.com";

function absUrl(url: string): string {
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${BASE}${url}`;
  return url;
}

function parseComicCards(html: string): MangaSummary[] {
  const $ = cheerio.load(html);
  const out: MangaSummary[] = [];
  const seen = new Set<string>();

  $("a[href^='/comics/']").each((_, a) => {
    const href = $(a).attr("href") ?? "";
    const m = href.match(/^\/comics\/([^/?#]+)(?:\/chapter\/[\d.]+)?$/);
    if (!m) return;
    const id = m[1];
    if (href.includes("/chapter/")) return;
    if (seen.has(id)) return;

    const img = $(a).find("img").first();
    const titleFromImg = img.attr("alt")?.trim();
    const titleFromText =
      $(a)
        .find(".line-clamp-2, .text-sm, h3, span.font-bold, .truncate")
        .first()
        .text()
        .trim();
    const title =
      titleFromText ||
      titleFromImg ||
      id.replace(/-[a-f0-9]{8}$/, "").replace(/-/g, " ");

    const cover =
      img.attr("src") ??
      img.attr("data-src") ??
      $(a).find("source").first().attr("srcset")?.split(/\s+/)[0] ??
      null;

    if (!title) return;
    seen.add(id);
    out.push({
      sourceId: "asura",
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

export const asura: MangaSource = {
  id: "asura",
  name: "AsuraScans",
  languages: ["en"],

  async search(query, opts) {
    const limit = opts?.limit ?? 30;
    const html = await fetchHtml(
      `${BASE}/browse?search=${encodeURIComponent(query)}`,
    );
    return paginate(parseComicCards(html).slice(0, limit));
  },

  async popular(opts) {
    const limit = opts?.limit ?? 24;
    const html = await fetchHtml(`${BASE}/browse?sort=popular`);
    let items = parseComicCards(html);
    if (items.length === 0) {
      const fallback = await fetchHtml(`${BASE}/browse`);
      items = parseComicCards(fallback);
    }
    return paginate(items.slice(0, limit));
  },

  async latest(opts) {
    const limit = opts?.limit ?? 24;
    const html = await fetchHtml(`${BASE}/browse?sort=update`);
    let items = parseComicCards(html);
    if (items.length === 0) {
      const fallback = await fetchHtml(`${BASE}/browse`);
      items = parseComicCards(fallback);
    }
    return paginate(items.slice(0, limit));
  },

  async getManga(mangaId): Promise<MangaDetail> {
    const html = await fetchHtml(`${BASE}/comics/${mangaId}`);
    const $ = cheerio.load(html);
    const title =
      $("h1").first().text().trim() ||
      $("meta[property='og:title']").attr("content")?.trim() ||
      mangaId.replace(/-[a-f0-9]{8}$/, "").replace(/-/g, " ");

    const coverUrl =
      $("#cover-viewer-img").attr("data-full-src") ??
      $("img[alt='" + title + "']").first().attr("src") ??
      $("meta[property='og:image']").attr("content") ??
      null;

    const description =
      $("section p, p.whitespace-pre-line, p.line-clamp-3")
        .first()
        .text()
        .trim() ||
      $("meta[property='og:description']").attr("content") ||
      "";

    const tags: string[] = [];
    $("a[href*='genres=']").each((_, el) => {
      const t = $(el).text().trim();
      if (t) tags.push(t);
    });

    const authors: string[] = [];
    $("a[href*='author=']").each((_, el) => {
      const t = $(el).text().trim();
      if (t) authors.push(t);
    });

    let status = "unknown";
    $("span, div, strong, button").each((_, el) => {
      const t = $(el).text().trim().toLowerCase();
      if (
        t === "ongoing" ||
        t === "completed" ||
        t === "hiatus" ||
        t === "dropped" ||
        t === "cancelled"
      ) {
        status = t;
      }
    });

    return {
      sourceId: "asura",
      id: mangaId,
      title: title || "Untitled",
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
    const html = await fetchHtml(`${BASE}/comics/${mangaId}`);
    const $ = cheerio.load(html);
    const out: Chapter[] = [];
    const seen = new Set<string>();

    $(`a[href^='/comics/${mangaId}/chapter/']`).each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const m = href.match(/\/chapter\/([\d.]+)$/);
      if (!m) return;
      const number = m[1];
      const id = `${mangaId}__${number}`;
      if (seen.has(id)) return;
      seen.add(id);
      const text = $(el).text().trim();
      const dateText = $(el).find("time, .text-xs, .opacity-60").first().text().trim();
      const titleText = text
        .replace(/Chapter\s*[\d.]+/i, "")
        .trim()
        .replace(/^[-—:]\s*/, "");
      out.push({
        id,
        number,
        volume: null,
        title: titleText || null,
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
    const html = await fetchHtml(`${BASE}/comics/${slug}/chapter/${number}`);
    const $ = cheerio.load(html);

    const urls: string[] = [];
    
    // Patterns to exclude (only obvious ads and social media)
    const excludePatterns = [
      /facebook/i,
      /twitter/i,
      /discord/i,
      /telegram/i,
      /patreon/i,
      /kofi/i,
      /donate/i,
    ];

    function shouldExclude(url: string): boolean {
      return excludePatterns.some(pattern => pattern.test(url));
    }

    $("img").each((_, el) => {
      const src = $(el).attr("src") ?? $(el).attr("data-src");
      if (!src) return;
      if (!/\.(jpe?g|png|webp)/i.test(src)) return;
      if (shouldExclude(src)) return;
      if (
        src.includes("cdn.asurascans.com") ||
        src.includes("asuracomic.net") ||
        src.includes("/asura-images/") ||
        src.includes("/storage/") ||
        src.includes("/uploads/")
      ) {
        urls.push(absUrl(src));
      }
    });

    if (urls.length === 0) {
      const scripts = $("script");
      scripts.each((_, el) => {
        const content = $(el).html() ?? "";
        if (!content.includes("asura-images") && !content.includes("cdn.asurascans"))
          return;
        const matches = Array.from(
          content.matchAll(
            /https?:\\?\/\\?\/[^"'\s\\]+\.(?:jpe?g|png|webp)/gi,
          ),
        );
        const filtered = matches
          .map((m) => m[0].replace(/\\\//g, "/"))
          .filter(url => !shouldExclude(url));
        urls.push(...filtered);
      });
    }

    return { chapterId, urls: Array.from(new Set(urls)) };
  },
};
