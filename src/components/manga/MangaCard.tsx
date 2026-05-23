import Link from "next/link";
import Image from "next/image";
import type { MangaSummary } from "@/lib/sources/types";
import { proxied } from "@/lib/image";

export function MangaCard({ manga }: { manga: MangaSummary }) {
  return (
    <Link
      href={`/manga/${manga.sourceId}/${manga.id}`}
      className="group block overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-foreground/40"
    >
      <div className="relative aspect-[2/3] w-full bg-muted">
        {manga.coverUrl ? (
          <Image
            src={proxied(manga.coverUrl)}
            alt={manga.title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 180px"
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized
          />
        ) : null}
      </div>
      <div className="p-2">
        <p className="line-clamp-2 text-sm font-medium leading-tight">
          {manga.title}
        </p>
      </div>
    </Link>
  );
}
