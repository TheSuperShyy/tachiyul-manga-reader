"use client";

import * as React from "react";
import { PaginatedReader } from "./PaginatedReader";
import { StripReader } from "./StripReader";
import { ReaderControls } from "./ReaderControls";
import { useSettings } from "@/lib/storage/settings";
import { useProgress } from "@/lib/storage/progress";
import { cn } from "@/lib/utils";

interface Props {
  sourceId: string;
  mangaId: string;
  chapterId: string;
  chapterLabel: string;
  pages: string[];
  prevChapterId: string | null;
  nextChapterId: string | null;
}

export function Reader({
  sourceId,
  mangaId,
  chapterId,
  chapterLabel,
  pages,
  prevChapterId,
  nextChapterId,
}: Props) {
  const mode = useSettings((s) => s.mode);
  const direction = useSettings((s) => s.direction);
  const fitWidth = useSettings((s) => s.fitWidth);
  const setProgress = useProgress((s) => s.set);
  const savedPage = useProgress(
    (s) => s.entries[`${sourceId}:${mangaId}`],
  );

  const initial = React.useMemo(() => {
    if (savedPage?.chapterId === chapterId) return savedPage.page;
    return 0;
  }, [chapterId, savedPage]);

  const [index, setIndex] = React.useState(initial);
  const [controlsVisible, setControlsVisible] = React.useState(true);

  React.useEffect(() => {
    setIndex(0);
    if (mode === "strip") window.scrollTo({ top: 0 });
  }, [chapterId, mode]);

  React.useEffect(() => {
    setProgress(sourceId, mangaId, {
      chapterId,
      page: index,
      totalPages: pages.length,
    });
  }, [sourceId, mangaId, chapterId, index, pages.length, setProgress]);

  const isStrip = mode === "strip";

  return (
    <div
      className={cn(
        "relative w-full bg-black",
        isStrip ? "min-h-[100dvh]" : "h-[100dvh] overflow-hidden",
      )}
    >
      {isStrip ? (
        <StripReader pages={pages} onPageVisible={setIndex} />
      ) : (
        <PaginatedReader
          pages={pages}
          index={index}
          direction={direction}
          fitWidth={fitWidth}
          onIndexChange={setIndex}
        />
      )}

      <ReaderControls
        sourceId={sourceId}
        mangaId={mangaId}
        chapterLabel={chapterLabel}
        prevChapterId={prevChapterId}
        nextChapterId={nextChapterId}
        visible={controlsVisible}
        onToggle={() => setControlsVisible((v) => !v)}
        showCenterTapZone={!isStrip}
      />
    </div>
  );
}
