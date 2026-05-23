import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_HOSTS = new Set([
  "uploads.mangadex.org",
  "asuracomic.net",
  "asurascans.com",
  "cdn.asurascans.com",
  "asura.gg",
  "weebcentral.com",
  "temp.compsci88.com",
  "scans.lastation.us",
  "official.lowee.us",
  "hot.leanbox.us",
  "official.s2.mangapark.fun",
]);

const ALLOWED_HOST_SUFFIXES = [
  ".mangadex.network",
  ".asuracomic.net",
  ".asurascans.com",
  ".asura.gg",
  ".comick.pictures",
  ".comick.fun",
  ".comick.io",
  ".comick.dev",
  ".weebcentral.com",
  ".compsci88.com",
  ".officialcdn.app",
];

function isAllowed(host: string): boolean {
  if (ALLOWED_HOSTS.has(host)) return true;
  return ALLOWED_HOST_SUFFIXES.some((s) => host.endsWith(s));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  if (target.protocol !== "https:" || !isAllowed(target.hostname)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 403 });
  }

  const referer = `${target.protocol}//${target.hostname}/`;

  const upstream = await fetch(target.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "image/*,*/*;q=0.8",
      Referer: referer,
    },
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: `upstream ${upstream.status}` },
      { status: upstream.status },
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
    },
  });
}
