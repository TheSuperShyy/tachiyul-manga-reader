"use client";

import * as React from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { useProgress } from "@/lib/storage/progress";
import { cn } from "@/lib/utils";

interface Props {
  sourceId: string;
  mangaId: string;
  firstChapterId: string | null;
}

export function ContinueReading({ sourceId, mangaId, firstChapterId }: Props) {
  const entry = useProgress((s) => s.entries[`${sourceId}:${mangaId}`]);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const targetChapter = mounted
    ? (entry?.chapterId ?? firstChapterId)
    : firstChapterId;
  if (!targetChapter) return null;

  const label = mounted && entry ? "Continue reading" : "Start reading";

  return (
    <Link
      href={`/read/${sourceId}/${mangaId}/${targetChapter}`}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90",
      )}
    >
      <Play className="h-4 w-4" />
      {label}
    </Link>
  );
}
