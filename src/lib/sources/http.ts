const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

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
      "User-Agent": DEFAULT_UA,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
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
