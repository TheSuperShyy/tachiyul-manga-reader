const BASE = "https://api.mangadex.org";
const USER_AGENT = "Tachiyul/0.1 (learning project)";

const MIN_INTERVAL_MS = 220;
let lastRequest = 0;
let queue: Promise<unknown> = Promise.resolve();

async function rateLimited<T>(fn: () => Promise<T>): Promise<T> {
  const run = async () => {
    const now = Date.now();
    const wait = Math.max(0, lastRequest + MIN_INTERVAL_MS - now);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequest = Date.now();
    return fn();
  };
  const next = queue.then(run, run);
  queue = next.catch(() => undefined);
  return next;
}

export type Query = Record<
  string,
  string | number | boolean | string[] | undefined | null
>;

function buildUrl(path: string, query?: Query): string {
  const url = new URL(BASE + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const v of value) url.searchParams.append(key, String(v));
      } else {
        url.searchParams.append(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function mdFetch<T>(path: string, query?: Query): Promise<T> {
  return rateLimited(async () => {
    const url = buildUrl(path, query);
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      throw new Error(`MangaDex ${res.status} for ${path}`);
    }
    return res.json() as Promise<T>;
  });
}
