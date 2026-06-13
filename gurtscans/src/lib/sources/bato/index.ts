import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import type {
  Chapter,
  MangaDetail,
  MangaSource,
  MangaSummary,
  PageList,
  Paginated,
} from "@/lib/sources/types";
import { fetchHtml } from "@/lib/sources/http";

const BASE = "https://bato.to";

function buildSummaryFromCard(
  $: cheerio.CheerioAPI,
  el: AnyNode,
): MangaSummary | null {
  const link = $(el).find("a.item-cover, a[href^='/title/']").first();
  const href = link.attr("href") ?? "";
  const idMatch = href.match(/\/title\/(\d+)(?:-([^/]+))?/);
  if (!idMatch) return null;
  const id = `${idMatch[1]}${idMatch[2] ? `-${idMatch[2]}` : ""}`;
  const title =
    $(el).find("a.item-title, .item-title a").first().text().trim() ||
    link.attr("title")?.trim() ||
    "";
  const img = $(el).find("img").first();
  const coverUrl =
    img.attr("data-src") ?? img.attr("src") ?? null;
  return {
    sourceId: "bato",
    id,
    title,
    coverUrl: coverUrl ? absUrl(coverUrl) : null,
  };
}

function absUrl(url: string): string {
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${BASE}${url}`;
  return url;
}

function parseList(html: string): MangaSummary[] {
  const $ = cheerio.load(html);
  const items: MangaSummary[] = [];
  $("#series-list .item, .series-list .item, div[data-hk='browse']").each(
    (_, el) => {
      const s = buildSummaryFromCard($, el);
      if (s && s.id) items.push(s);
    },
  );
  if (items.length === 0) {
    $("a[href^='/title/']").each((_, a) => {
      const href = $(a).attr("href") ?? "";
      const idMatch = href.match(/\/title\/(\d+)(?:-([^/]+))?/);
      if (!idMatch) return;
      const id = `${idMatch[1]}${idMatch[2] ? `-${idMatch[2]}` : ""}`;
      const title = $(a).attr("title")?.trim() || $(a).text().trim();
      const img = $(a).find("img").first();
      const coverUrl = img.attr("data-src") ?? img.attr("src") ?? null;
      if (title && id && !items.find((x) => x.id === id)) {
        items.push({
          sourceId: "bato",
          id,
          title,
          coverUrl: coverUrl ? absUrl(coverUrl) : null,
        });
      }
    });
  }
  return items;
}

function paginate<T>(items: T[], offset: number, limit: number): Paginated<T> {
  return { items, total: items.length, offset, limit };
}

export const bato: MangaSource = {
  id: "bato",
  name: "Bato.to",
  languages: ["en"],

  async search(query, opts) {
    const limit = opts?.limit ?? 30;
    const html = await fetchHtml(
      `${BASE}/v3x-search?word=${encodeURIComponent(query)}&lang=en`,
    );
    const items = parseList(html).slice(0, limit);
    return paginate(items, 0, limit);
  },

  async popular(opts) {
    const limit = opts?.limit ?? 24;
    const html = await fetchHtml(
      `${BASE}/browse?langs=en&sort=views_a&page=1`,
    );
    const items = parseList(html).slice(0, limit);
    return paginate(items, 0, limit);
  },

  async latest(opts) {
    const limit = opts?.limit ?? 24;
    const html = await fetchHtml(
      `${BASE}/browse?langs=en&sort=update&page=1`,
    );
    const items = parseList(html).slice(0, limit);
    return paginate(items, 0, limit);
  },

  async getManga(mangaId): Promise<MangaDetail> {
    const html = await fetchHtml(`${BASE}/title/${mangaId}`);
    const $ = cheerio.load(html);
    const title =
      $("h3.item-title").first().text().trim() ||
      $("h1").first().text().trim();
    const coverUrl =
      $("img.shadow-6, .attr-cover img").first().attr("src") ??
      $("meta[property='og:image']").attr("content") ??
      null;
    const description =
      $(".limit-html-p, #limit-html").first().text().trim() ||
      $("meta[property='og:description']").attr("content") ||
      "";
    const tags: string[] = [];
    $("a[href*='/browse?genres=']").each((_, el) => {
      const t = $(el).text().trim();
      if (t) tags.push(t);
    });
    const authors: string[] = [];
    $("a[href*='/browse?authors=']").each((_, el) => {
      const t = $(el).text().trim();
      if (t) authors.push(t);
    });
    const status =
      $(".attr-item:contains('Status') span").last().text().trim() ||
      "unknown";

    return {
      sourceId: "bato",
      id: mangaId,
      title: title || "Untitled",
      coverUrl: coverUrl ? absUrl(coverUrl) : null,
      description,
      tags: Array.from(new Set(tags)),
      status: status.toLowerCase(),
      authors,
      artists: [],
      originalLanguage: "",
      year: null,
      altTitles: [],
    };
  },

  async getChapters(mangaId, opts): Promise<Paginated<Chapter>> {
    const html = await fetchHtml(`${BASE}/title/${mangaId}`);
    const $ = cheerio.load(html);
    const out: Chapter[] = [];
    $("a.chapt, a[href^='/chapter/']").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const idMatch = href.match(/\/chapter\/(\d+)/);
      if (!idMatch) return;
      const id = idMatch[1];
      const text = $(el).text().trim();
      const numMatch = text.match(/(?:ch(?:apter)?\.?\s*)?([\d.]+)/i);
      const number = numMatch ? numMatch[1] : null;
      const titleMatch = text.replace(/^ch(?:apter)?\.?\s*[\d.]+:?\s*/i, "");
      const dateText = $(el)
        .closest("div, li")
        .find("time, .extra .item-time, .time")
        .first()
        .text()
        .trim();
      out.push({
        id,
        number,
        volume: null,
        title: titleMatch && titleMatch !== text ? titleMatch : null,
        lang: "en",
        publishedAt: dateText || new Date().toISOString(),
        pages: 0,
        groupName: null,
      });
    });

    const seen = new Set<string>();
    const deduped = out.filter((c) => {
      const k = c.id;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const order = opts?.order ?? "asc";
    deduped.sort((a, b) => {
      const an = a.number ? parseFloat(a.number) : Number.POSITIVE_INFINITY;
      const bn = b.number ? parseFloat(b.number) : Number.POSITIVE_INFINITY;
      if (Number.isNaN(an) && Number.isNaN(bn)) return 0;
      if (Number.isNaN(an)) return 1;
      if (Number.isNaN(bn)) return -1;
      return order === "asc" ? an - bn : bn - an;
    });

    return paginate(deduped, 0, deduped.length);
  },

  async getPages(chapterId): Promise<PageList> {
    const html = await fetchHtml(`${BASE}/chapter/${chapterId}`);
    const $ = cheerio.load(html);
    let urls: string[] = [];

    const script = $("script")
      .filter((_, el) => $(el).html()?.includes("imgHttps") ?? false)
      .first()
      .html();
    if (script) {
      const m = script.match(/const\s+imgHttps\s*=\s*(\[[^\]]+\])/);
      if (m) {
        try {
          urls = JSON.parse(m[1].replace(/'/g, '"'));
        } catch {
          /* ignore */
        }
      }
    }

    if (urls.length === 0) {
      const astroState = $("script[type='application/json']").html();
      if (astroState) {
        const matches = Array.from(
          astroState.matchAll(
            /https?:\/\/[^"'\s]+\.(?:jpe?g|png|webp)(?:\?[^"'\s]*)?/gi,
          ),
        );
        urls = matches.map((m) => m[0]);
      }
    }

    if (urls.length === 0) {
      $("img.page-img").each(
        (_, el) => {
          const src = $(el).attr("data-src") ?? $(el).attr("src");
          if (src) urls.push(src);
        },
      );
    }

    return { chapterId, urls };
  },
};
