"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { proxied } from "@/lib/image";
import { cn } from "@/lib/utils";

interface Props {
  pages: string[];
  index: number;
  direction: "ltr" | "rtl";
  fitWidth: boolean;
  onIndexChange: (next: number) => void;
  sourceId: string;
  mangaId: string;
  prevChapterId: string | null;
  nextChapterId: string | null;
}

export function PaginatedReader({
  pages,
  index,
  direction,
  fitWidth,
  onIndexChange,
  sourceId,
  mangaId,
  prevChapterId,
  nextChapterId,
}: Props) {
  const router = useRouter();
  const total = pages.length;

  const go = React.useCallback(
    (delta: number) => {
      const next = Math.min(Math.max(index + delta, 0), total - 1);
      onIndexChange(next);
    },
    [index, total, onIndexChange],
  );

  const forward = direction === "rtl" ? -1 : 1;

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        // If at last page and next chapter exists, go to next chapter
        if (index === total - 1 && nextChapterId) {
          router.push(`/read/${sourceId}/${mangaId}/${nextChapterId}`);
        } else {
          go(forward);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        // If at first page and previous chapter exists, go to previous chapter
        if (index === 0 && prevChapterId) {
          router.push(`/read/${sourceId}/${mangaId}/${prevChapterId}`);
        } else {
          go(-forward);
        }
      } else if (e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, forward, index, total, nextChapterId, prevChapterId, sourceId, mangaId, router]);

  React.useEffect(() => {
    const toPreload = pages.slice(index + 1, index + 4);
    toPreload.forEach((url) => {
      const img = new window.Image();
      img.src = proxied(url);
    });
  }, [index, pages]);

  const current = pages[index];
  if (!current) return null;

  return (
    <div className="relative flex h-full w-full select-none items-center justify-center bg-black">
      <Image
        key={current}
        src={proxied(current)}
        alt={`Page ${index + 1}`}
        width={1200}
        height={1800}
        className={cn(
          "max-h-[100dvh] w-auto object-contain",
          fitWidth && "w-full max-w-3xl",
        )}
        unoptimized
        priority
      />

      <button
        aria-label={direction === "rtl" ? "Next page" : "Previous page"}
        className="absolute left-0 top-0 h-full w-1/3 cursor-pointer focus:outline-none"
        onClick={() => go(-forward)}
      />
      <button
        aria-label={direction === "rtl" ? "Previous page" : "Next page"}
        className="absolute right-0 top-0 h-full w-1/3 cursor-pointer focus:outline-none"
        onClick={() => go(forward)}
      />

      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
        {index + 1} / {total}
      </div>
    </div>
  );
}
