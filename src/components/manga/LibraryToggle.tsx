"use client";

import * as React from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLibrary } from "@/lib/storage/library";

interface Props {
  sourceId: string;
  mangaId: string;
  title: string;
  coverUrl: string | null;
}

export function LibraryToggle({ sourceId, mangaId, title, coverUrl }: Props) {
  const has = useLibrary((s) => s.has(sourceId, mangaId));
  const toggle = useLibrary((s) => s.toggle);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="outline" disabled>
        <Bookmark className="h-4 w-4" />
        In library
      </Button>
    );
  }

  return (
    <Button
      variant={has ? "default" : "outline"}
      onClick={() => toggle({ sourceId, mangaId, title, coverUrl })}
    >
      {has ? (
        <>
          <BookmarkCheck className="h-4 w-4" />
          In library
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4" />
          Add to library
        </>
      )}
    </Button>
  );
}
