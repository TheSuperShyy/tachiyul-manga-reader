"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useLibrary } from "@/lib/storage/library";
import { useProgress } from "@/lib/storage/progress";
import { proxied } from "@/lib/image";

export default function LibraryPage() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const entriesMap = useLibrary((s) => s.entries);
  const progress = useProgress((s) => s.entries);
  const entries = React.useMemo(
    () =>
      Object.values(entriesMap).sort((a, b) => b.addedAt - a.addedAt),
    [entriesMap],
  );

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h2 className="mb-4 text-xl font-semibold">Library</h2>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-3">
        <h2 className="text-xl font-semibold">Library</h2>
        <p className="text-sm text-muted-foreground">
          Your library is empty. Add manga from a series page to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
      <h2 className="text-xl font-semibold">Library</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {entries.map((m) => {
          const key = `${m.sourceId}:${m.mangaId}`;
          const p = progress[key];
          return (
            <Link
              key={key}
              href={`/manga/${m.sourceId}/${m.mangaId}`}
              className="group block overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-foreground/40"
            >
              <div className="relative aspect-[2/3] w-full bg-muted">
                {m.coverUrl && (
                  <Image
                    src={proxied(m.coverUrl)}
                    alt={m.title}
                    fill
                    sizes="(max-width: 640px) 45vw, 180px"
                    className="object-cover transition-transform group-hover:scale-105"
                    unoptimized
                  />
                )}
                {p && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-[10px] text-white">
                    Page {p.page + 1} / {p.totalPages}
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="line-clamp-2 text-sm font-medium leading-tight">
                  {m.title}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
