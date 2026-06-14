"use client";

import Link from "next/link";
import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Chapter } from "@/lib/sources/types";
import { useProgress } from "@/lib/storage/progress";
import { cn } from "@/lib/utils";

const BUCKET_SIZE = 100;

interface Props {
  sourceId: string;
  mangaId: string;
  chapters: Chapter[];
}

interface Bucket {
  label: string;
  startNum: number | null;
  chapters: Chapter[];
}

function buildBuckets(chapters: Chapter[]): Bucket[] {
  const numbered: Chapter[] = [];
  const unnumbered: Chapter[] = [];
  for (const c of chapters) {
    const n = c.number ? parseFloat(c.number) : NaN;
    if (Number.isNaN(n)) unnumbered.push(c);
    else numbered.push(c);
  }

  if (numbered.length === 0 && unnumbered.length === 0) return [];

  const max = numbered.reduce(
    (m, c) => Math.max(m, parseFloat(c.number ?? "0")),
    0,
  );

  const buckets: Bucket[] = [];
  for (let start = 1; start <= max; start += BUCKET_SIZE) {
    const end = start + BUCKET_SIZE - 1;
    const items = numbered.filter((c) => {
      const n = parseFloat(c.number ?? "0");
      return n >= start && n <= end;
    });
    if (items.length === 0) continue;
    buckets.push({
      label: `${start}–${Math.min(end, Math.ceil(max))}`,
      startNum: start,
      chapters: items.sort(
        (a, b) =>
          parseFloat(b.number ?? "0") - parseFloat(a.number ?? "0"),
      ),
    });
  }

  if (unnumbered.length > 0) {
    buckets.push({
      label: "Other",
      startNum: null,
      chapters: unnumbered,
    });
  }

  return buckets.reverse();
}

function chapterLabel(ch: Chapter): string {
  if (ch.number != null) {
    return ch.title
      ? `Chapter ${ch.number} — ${ch.title}`
      : `Chapter ${ch.number}`;
  }
  return ch.title || "Untitled chapter";
}

export function ChapterList({ sourceId, mangaId, chapters }: Props) {
  const lastReadId = useProgress(
    (s) => s.entries[`${sourceId}:${mangaId}`]?.chapterId,
  );

  const buckets = React.useMemo(() => buildBuckets(chapters), [chapters]);
  const initialOpen = React.useMemo(() => {
    const set = new Set<string>();
    if (buckets[0]) set.add(buckets[0].label);
    if (lastReadId) {
      const owner = buckets.find((b) =>
        b.chapters.some((c) => c.id === lastReadId),
      );
      if (owner) set.add(owner.label);
    }
    return set;
  }, [buckets, lastReadId]);

  const [open, setOpen] = React.useState<Set<string>>(initialOpen);

  React.useEffect(() => {
    setOpen(initialOpen);
  }, [initialOpen]);

  function toggle(label: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  if (buckets.length === 0) return null;

  if (buckets.length === 1) {
    return (
      <ChapterRows
        sourceId={sourceId}
        mangaId={mangaId}
        chapters={buckets[0].chapters}
        lastReadId={lastReadId}
      />
    );
  }

  return (
    <div className="space-y-2">
      {buckets.map((bucket) => {
        const isOpen = open.has(bucket.label);
        const hasCurrent =
          lastReadId &&
          bucket.chapters.some((c) => c.id === lastReadId);
        return (
          <div
            key={bucket.label}
            className="rounded-lg border border-border bg-card overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggle(bucket.label)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-accent"
            >
              <span className="flex items-center gap-2 font-medium">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Chapters {bucket.label}
                {hasCurrent && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Reading
                  </span>
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {bucket.chapters.length}
              </span>
            </button>
            {isOpen && (
              <ChapterRows
                sourceId={sourceId}
                mangaId={mangaId}
                chapters={bucket.chapters}
                lastReadId={lastReadId}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChapterRows({
  sourceId,
  mangaId,
  chapters,
  lastReadId,
}: {
  sourceId: string;
  mangaId: string;
  chapters: Chapter[];
  lastReadId: string | undefined;
}) {
  return (
    <ul className="divide-y divide-border border-t border-border">
      {chapters.map((ch) => {
        const isCurrent = ch.id === lastReadId;
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
                <p className="truncate font-medium">{chapterLabel(ch)}</p>
                {ch.groupName && (
                  <p className="truncate text-xs text-muted-foreground">
                    {ch.groupName}
                  </p>
                )}
              </div>
              <div className="ml-4 shrink-0 text-right text-xs text-muted-foreground">
                <p>{new Date(ch.publishedAt).toLocaleDateString()}</p>
                {ch.pages > 0 && <p>{ch.pages} pages</p>}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
