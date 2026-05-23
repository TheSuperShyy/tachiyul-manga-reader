"use client";

import * as React from "react";
import { proxied } from "@/lib/image";

interface Props {
  pages: string[];
  onPageVisible: (index: number) => void;
}

export function StripReader({ pages, onPageVisible }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const idx = Number((visible.target as HTMLElement).dataset.index);
          if (!Number.isNaN(idx)) onPageVisible(idx);
        }
      },
      { root: null, threshold: [0.3, 0.6] },
    );
    const nodes = root.querySelectorAll<HTMLElement>("[data-page]");
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [pages, onPageVisible]);

  return (
    <div
      ref={containerRef}
      className="mx-auto flex w-full max-w-3xl flex-col bg-black pb-24"
    >
      {pages.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={url}
          data-page
          data-index={i}
          src={proxied(url)}
          alt={`Page ${i + 1}`}
          loading={i < 2 ? "eager" : "lazy"}
          decoding="async"
          className="block w-full h-auto"
        />
      ))}
    </div>
  );
}
