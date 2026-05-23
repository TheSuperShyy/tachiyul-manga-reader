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

const BASE = "https://mangakakalot.fun";

function absUrl(url: string): string {
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${BASE}${url}`;
  return url;
}

function extractSlug(href: string): string | null {
  const m = href.match(/^\/(?:manga|read)\/([^/?#]+)/);
  if (m) return m[1];
  return null;
}

function parseMangaCards(html: string): MangaSummary[] {
  const $ = cheerio.load(html);
  const out: MangaSummary[] = [];
  const seen = new Set<string>();

  $("a").each((_, a) => {
    const href = $(a).attr("href") ?? "";
    const slug = extractSlug(href);
    if (!slug) return;
    if (href.includes("/chapter") || href.includes("/genre")) return;
    if (seen.has(slug)) return;

    const img = $(a).find("img").first();
    const cover = img.attr("src") ?? img.attr("data-src") ?? null;
    const title =
      $(a).attr("title")?.trim() ||
      img.attr("alt")?.trim() ||
      $(a).find("h3, h4, .title, .name").first().text().trim() ||
      "";

    if (!title) return;
    seen.add(slug);
    out.push({
      sourceId: "mangakakalot",
      id: slug,
      title,
      coverUrl: cover ? absUrl(cover) : null,
    });
  });
  return out;
}

function paginate<T>(items: T[]): Paginated<T> {
  return { items, total: items.length, offset: 0, limit: items.length };
}

export const mangakakalot: MangaSource = {
  id: "mangakakalot",
  name: "MangaKakalot",
  languages: ["en"],

  async search(query, opts) {
    const limit = opts?.limit ?? 30;
    const slug = query.trim().toLowerCase().replace(/\s+/g, "_");
    const candidates = [
      `${BASE}/search/story/${slug}`,
      `${BASE}/search/${encodeURIComponent(query)}`,
      `${BASE}/search?q=${encodeURIComponent(query)}`,
    ];
    for (const url of candidates) {
      try {
        const html = await fetchHtml(url);
        const items = parseMangaCards(html);
        if (items.length > 0) return paginate(items.slice(0, limit));
      } catch {
        /* try next */
      }
    }
    return paginate([]);
  },

  async popular(opts) {
    const limit = opts?.limit ?? 24;
    const candidates = [
      `${BASE}/manga_list?type=topview&category=all&state=all&page=1`,
      `${BASE}/popular`,
      `${BASE}/`,
    ];
    for (const url of candidates) {
      try {
        const html = await fetchHtml(url);
        const items = parseMangaCards(html);
        if (items.length > 0) return paginate(items.slice(0, limit));
      } catch {
        /* try next */
      }
    }
    return paginate([]);
  },

  async latest(opts) {
    const limit = opts?.limit ?? 24;
    const candidates = [
      `${BASE}/manga_list?type=latest&category=all&state=all&page=1`,
      `${BASE}/latest`,
      `${BASE}/`,
    ];
    for (const url of candidates) {
      try {
        const html = await fetchHtml(url);
        const items = parseMangaCards(html);
        if (items.length > 0) return paginate(items.slice(0, limit));
      } catch {
        /* try next */
      }
    }
    return paginate([]);
  },

  async getManga(mangaId): Promise<MangaDetail> {
    const candidates = [`${BASE}/manga/${mangaId}`, `${BASE}/read/${mangaId}`];
    let html = "";
    for (const url of candidates) {
      try {
        html = await fetchHtml(url);
        if (html.length > 0) break;
      } catch {
        /* try next */
      }
    }
    const $ = cheerio.load(html);
    const title =
      $("h1, .manga-info-text h1, .story-info-right h1").first().text().trim() ||
      $("meta[property='og:title']").attr("content") ||
      mangaId.replace(/-/g, " ");
    const coverUrl =
      $(".manga-info-pic img, .info-image img, .story-info-left img").first().attr("src") ??
      $("meta[property='og:image']").attr("content") ??
      null;
    const description =
      $("#noidungm, #panel-story-info-description, .story-info-right .panel-story-info-description").first().text().trim() ||
      $("meta[property='og:description']").attr("content") ||
      "";

    const tags: string[] = [];
    $("a[href*='/genre/'], a[href*='/manga_list?category=']").each((_, el) => {
      const t = $(el).text().trim();
      if (t) tags.push(t);
    });

    const authors: string[] = [];
    $("a[href*='/author/'], .table-value a[href*='author']").each((_, el) => {
      const t = $(el).text().trim();
      if (t) authors.push(t);
    });

    let status = "unknown";
    $("td, span, li").each((_, el) => {
      const t = $(el).text().trim();
      if (/^(Ongoing|Completed|Hiatus|Dropped)$/i.test(t)) {
        status = t.toLowerCase();
      }
    });

    return {
      sourceId: "mangakakalot",
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
    const candidates = [`${BASE}/manga/${mangaId}`, `${BASE}/read/${mangaId}`];
    let html = "";
    for (const url of candidates) {
      try {
        html = await fetchHtml(url);
        if (html.length > 0) break;
      } catch {
        /* try next */
      }
    }
    const $ = cheerio.load(html);
    const out: Chapter[] = [];
    const seen = new Set<string>();

    $("a[href*='/chapter']").each((_, a) => {
      const href = $(a).attr("href") ?? "";
      const m = href.match(/chapter[-_]?(\d+(?:\.\d+)?)/i);
      if (!m) return;
      const number = m[1];
      const id = href.startsWith("http")
        ? href.replace(/^https?:\/\/[^/]+/, "")
        : href;
      if (seen.has(id)) return;
      seen.add(id);
      const dateText = $(a)
        .closest("li, tr, div.row-content-chapter")
        .find(".chapter-time, .row-content-chapter span, time")
        .first()
        .text()
        .trim();
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
    const url = chapterId.startsWith("http")
      ? chapterId
      : `${BASE}${chapterId.startsWith("/") ? "" : "/"}${chapterId}`;
    const html = await fetchHtml(url, { headers: { Referer: BASE } });
    const $ = cheerio.load(html);

    const urls: string[] = [];
    $(
      ".container-chapter-reader img, #vungdoc img, .reader-content img, .vungdoc img",
    ).each((_, img) => {
      const src =
        $(img).attr("data-src") ?? $(img).attr("src") ?? $(img).attr("data-original");
      if (src && /\.(jpe?g|png|webp)/i.test(src)) urls.push(src);
    });

    if (urls.length === 0) {
      $("img").each((_, img) => {
        const src = $(img).attr("data-src") ?? $(img).attr("src");
        if (!src) return;
        if (!/\.(jpe?g|png|webp)/i.test(src)) return;
        if (
          src.includes("logo") ||
          src.includes("avatar") ||
          src.includes("/icon")
        )
          return;
        if (src.match(/cdn|mangakakalot|mkkl|s2|s3/i)) urls.push(src);
      });
    }

    return { chapterId, urls };
  },
};
