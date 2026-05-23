"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Rows3,
  Square,
  ArrowLeftRight,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSettings } from "@/lib/storage/settings";
import { cn } from "@/lib/utils";

interface Props {
  sourceId: string;
  mangaId: string;
  chapterLabel: string;
  prevChapterId: string | null;
  nextChapterId: string | null;
  visible: boolean;
  onToggle: () => void;
  showCenterTapZone?: boolean;
}

export function ReaderControls({
  sourceId,
  mangaId,
  chapterLabel,
  prevChapterId,
  nextChapterId,
  visible,
  onToggle,
  showCenterTapZone = true,
}: Props) {
  const { mode, direction, fitWidth, set } = useSettings();

  return (
    <>
      {showCenterTapZone && (
        <button
          aria-label="Toggle reader controls"
          onClick={onToggle}
          className="absolute left-1/3 top-0 z-10 h-full w-1/3 cursor-pointer focus:outline-none"
        />
      )}

      {!showCenterTapZone && (
        <button
          aria-label="Toggle reader controls"
          onClick={onToggle}
          className="fixed right-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-md backdrop-blur transition-opacity hover:opacity-100"
          style={{ opacity: visible ? 0 : 0.85 }}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      )}

      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-20 transition-transform duration-200",
          visible ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <div className="pointer-events-auto flex items-center gap-2 border-b border-border bg-background/95 px-3 py-2 backdrop-blur">
          <Link
            href={`/manga/${sourceId}/${mangaId}`}
            className="inline-flex h-10 items-center gap-1 rounded-md px-2 text-sm hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <div className="ml-2 min-w-0 flex-1 truncate text-sm font-medium">
            {chapterLabel}
          </div>
          {!showCenterTapZone && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              aria-label="Hide controls"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-20 transition-transform duration-200",
          visible ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 border-t border-border bg-background/95 px-3 py-2 backdrop-blur">
          <PrevNext
            sourceId={sourceId}
            mangaId={mangaId}
            chapterId={prevChapterId}
            label="Prev"
            icon={<ArrowLeft className="h-4 w-4" />}
            disabled={!prevChapterId}
          />
          <div className="flex items-center rounded-md border border-border">
            <Button
              variant={mode === "paginated" ? "default" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => set({ mode: "paginated" })}
              aria-label="Paginated mode"
            >
              <Square className="h-4 w-4" />
              Page
            </Button>
            <Button
              variant={mode === "strip" ? "default" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => set({ mode: "strip" })}
              aria-label="Strip mode"
            >
              <Rows3 className="h-4 w-4" />
              Strip
            </Button>
          </div>
          {mode === "paginated" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                set({ direction: direction === "ltr" ? "rtl" : "ltr" })
              }
            >
              <ArrowLeftRight className="h-4 w-4" />
              {direction === "ltr" ? "L→R" : "R→L"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => set({ fitWidth: !fitWidth })}
          >
            {fitWidth ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
            {fitWidth ? "Fit height" : "Fit width"}
          </Button>
          <PrevNext
            sourceId={sourceId}
            mangaId={mangaId}
            chapterId={nextChapterId}
            label="Next"
            icon={<ArrowRight className="h-4 w-4" />}
            disabled={!nextChapterId}
          />
        </div>
      </div>
    </>
  );
}

function PrevNext({
  sourceId,
  mangaId,
  chapterId,
  label,
  icon,
  disabled,
}: {
  sourceId: string;
  mangaId: string;
  chapterId: string | null;
  label: string;
  icon: React.ReactNode;
  disabled: boolean;
}) {
  if (disabled || !chapterId) {
    return (
      <Button variant="ghost" size="sm" disabled>
        {label === "Prev" && icon}
        {label}
        {label === "Next" && icon}
      </Button>
    );
  }
  return (
    <Link
      href={`/read/${sourceId}/${mangaId}/${chapterId}`}
      className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-sm hover:bg-accent"
    >
      {label === "Prev" && icon}
      {label}
      {label === "Next" && icon}
    </Link>
  );
}
