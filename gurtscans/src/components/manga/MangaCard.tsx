import Link from "next/link";
import Image from "next/image";
import type { MangaSummary } from "@/lib/sources/types";
import { proxied } from "@/lib/image";

interface Props {
  manga: MangaSummary;
  large?: boolean;
}

export function MangaCard({ manga, large = false }: Props) {
  return (
    <Link
      href={`/manga/${manga.sourceId}/${manga.id}`}
      className={`group block overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 ${large ? "h-full" : ""}`}
    >
      <div className={`relative aspect-[2/3] w-full bg-muted overflow-hidden ${large ? "h-64" : ""}`}>
        {manga.coverUrl ? (
          <Image
            src={proxied(manga.coverUrl)}
            alt={manga.title}
            fill
            sizes={large ? "(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 250px" : "(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 180px"}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className={`p-3 ${large ? "p-4" : ""}`}>
        <p className={`line-clamp-2 font-medium leading-tight group-hover:text-primary transition-colors ${large ? "text-base" : "text-sm"}`}>
          {manga.title}
        </p>
      </div>
    </Link>
  );
}
