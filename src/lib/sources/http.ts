const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": DEFAULT_UA,
  "Accept-Language": "en-US,en;q=0.9",
  "sec-ch-ua":
    '"Not_A Brand";v="8", "Chromium";v="124", "Google Chrome";v="124"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
};

interface FetchOpts {
  headers?: Record<string, string>;
  revalidate?: number;
}

export async function fetchHtml(
  url: string,
  opts: FetchOpts = {},
): Promise<string> {
  const res = await fetch(url, {
    headers: {
      ...BROWSER_HEADERS,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      ...opts.headers,
    },
    next: { revalidate: opts.revalidate ?? 60 },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.text();
}

export async function fetchJson<T>(
  url: string,
  opts: FetchOpts = {},
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": DEFAULT_UA,
      Accept: "application/json",
      ...opts.headers,
    },
    next: { revalidate: opts.revalidate ?? 60 },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json() as Promise<T>;
}

export async function tryFetchHtml(
  urls: string[],
  opts: FetchOpts = {},
): Promise<string> {
  let lastErr: unknown;
  for (const url of urls) {
    try {
      const html = await fetchHtml(url, opts);
      if (html && html.length > 200) return html;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error(`All candidate URLs failed`);
}
