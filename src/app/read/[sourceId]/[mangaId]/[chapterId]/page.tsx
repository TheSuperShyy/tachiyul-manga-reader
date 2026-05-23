import { notFound } from "next/navigation";
import { getSource } from "@/lib/sources/registry";
import { Reader } from "@/components/reader/Reader";

interface PageParams {
  sourceId: string;
  mangaId: string;
  chapterId: string;
}

export const dynamic = "force-dynamic";

export default async function ReadPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { sourceId, mangaId, chapterId } = await params;
  const source = getSource(sourceId);

  let pages;
  let chapters;
  try {
    [pages, chapters] = await Promise.all([
      source.getPages(chapterId),
      source.getChapters(mangaId, { limit: 500, order: "asc" }),
    ]);
  } catch {
    notFound();
  }

  if (!pages.urls.length) notFound();

  const idx = chapters.items.findIndex((c) => c.id === chapterId);
  const current = chapters.items[idx];
  const prev = idx > 0 ? chapters.items[idx - 1] : null;
  const next = idx >= 0 && idx < chapters.items.length - 1
    ? chapters.items[idx + 1]
    : null;

  const label = current
    ? current.number != null
      ? `Chapter ${current.number}${current.title ? ` — ${current.title}` : ""}`
      : current.title || "Chapter"
    : "Chapter";

  return (
    <Reader
      sourceId={sourceId}
      mangaId={mangaId}
      chapterId={chapterId}
      chapterLabel={label}
      pages={pages.urls}
      prevChapterId={prev?.id ?? null}
      nextChapterId={next?.id ?? null}
    />
  );
}
