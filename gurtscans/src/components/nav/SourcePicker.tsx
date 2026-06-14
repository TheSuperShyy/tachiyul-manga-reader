"use client";

import * as React from "react";
import { ChevronDown, Database } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePrefs } from "@/lib/storage/preferences";
import { cn } from "@/lib/utils";

interface SourceMeta {
  id: string;
  name: string;
}

interface Props {
  sources: SourceMeta[];
}

export function SourcePicker({ sources }: Props) {
  const activeId = usePrefs((s) => s.activeSourceId);
  const setActive = usePrefs((s) => s.setActiveSourceId);
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
    if (!sources.find((s) => s.id === activeId)) {
      setActive(sources[0]?.id ?? "mangadex");
    }
  }, [sources, activeId, setActive]);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const urlSource = params.get("source");
  const effective = urlSource ?? (mounted ? activeId : "mangadex");
  const current = sources.find((s) => s.id === effective) ?? sources[0];

  function pick(id: string) {
    setActive(id);
    setOpen(false);
    if (pathname === "/" || pathname === "/search") {
      const next = new URLSearchParams(params.toString());
      next.set("source", id);
      router.push(`${pathname}?${next.toString()}`);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium hover:bg-accent"
      >
        <Database className="h-4 w-4" />
        <span className="hidden sm:inline">{current.name}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-md border border-border bg-card shadow-lg">
          {sources.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pick(s.id)}
              className={cn(
                "block w-full px-3 py-2 text-left text-sm hover:bg-accent",
                s.id === current.id && "bg-accent font-medium",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
