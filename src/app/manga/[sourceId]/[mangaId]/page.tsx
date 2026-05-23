import Image from "next/image";
import { notFound } from "next/navigation";
import { getSource } from "@/lib/sources/registry";
import { proxied } from "@/lib/image";
import { Badge } from "@/components/ui/Badge";
import { LibraryToggle } from "@/components/manga/LibraryToggle";
import { ContinueReading } from "@/components/manga/ContinueReading";
import { ChapterList } from "@/components/manga/ChapterList";

export const revalidate = 300;

interface PageParams {
  sourceId: string;
  mangaId: string;
}

export default async function MangaPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { sourceId, mangaId } = await params;
  let manga;
  let chapters;
  try {
    const source = getSource(sourceId);
    [manga, chapters] = await Promise.all([
      source.getManga(mangaId),
      source.getChapters(mangaId, { limit: 500, order: "asc" }),
    ]);
  } catch {
    notFound();
  }

  const firstChapter = chapters.items[0]?.id ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="relative mx-auto aspect-[2/3] w-48 shrink-0 overflow-hidden rounded-lg border border-border bg-muted md:mx-0 md:w-64">
          {manga.coverUrl && (
            <Image
              src={proxied(manga.coverUrl)}
              alt={manga.title}
              fill
              sizes="256px"
              className="object-cover"
              unoptimized
              priority
            />
          )}
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {manga.title}
            </h1>
            {manga.authors.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {manga.authors.join(", ")}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="capitalize">{manga.status}</Badge>
            {manga.year && <Badge>{manga.year}</Badge>}
            {manga.tags.slice(0, 6).map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
          {manga.description && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground line-clamp-6">
              {manga.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <ContinueReading
              sourceId={sourceId}
              mangaId={mangaId}
              firstChapterId={firstChapter}
            />
            <LibraryToggle
              sourceId={sourceId}
              mangaId={mangaId}
              title={manga.title}
              coverUrl={manga.coverUrl}
            />
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">
          Chapters{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({chapters.items.length})
          </span>
        </h2>
        {chapters.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No English chapters available yet.
          </p>
        ) : (
          <ChapterList
            sourceId={sourceId}
            mangaId={mangaId}
            chapters={chapters.items}
          />
        )}
      </section>
    </div>
  );
}
