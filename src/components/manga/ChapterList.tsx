"use client";

import Link from "next/link";
import * as React from "react";
import type { Chapter } from "@/lib/sources/types";
import { useProgress } from "@/lib/storage/progress";
import { cn } from "@/lib/utils";

interface Props {
  sourceId: string;
  mangaId: string;
  chapters: Chapter[];
}

export function ChapterList({ sourceId, mangaId, chapters }: Props) {
  const lastReadId = useProgress(
    (s) => s.entries[`${sourceId}:${mangaId}`]?.chapterId,
  );

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {chapters.map((ch) => {
        const isCurrent = ch.id === lastReadId;
        const label =
          ch.number != null
            ? `Chapter ${ch.number}${ch.title ? ` — ${ch.title}` : ""}`
            : ch.title || "Untitled chapter";
        return (
          <li key={ch.id}>
            <Link
              href={`/read/${sourceId}/${mangaId}/${ch.id}`}
              className={cn(
                "flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-accent",
                isCurrent && "bg-accent/60",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{label}</p>
                {ch.groupName && (
                  <p className="truncate text-xs text-muted-foreground">
                    {ch.groupName}
                  </p>
                )}
              </div>
              <div className="ml-4 shrink-0 text-right text-xs text-muted-foreground">
                <p>{new Date(ch.publishedAt).toLocaleDateString()}</p>
                <p>{ch.pages} pages</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
