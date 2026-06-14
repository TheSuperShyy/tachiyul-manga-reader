import type { MangaSummary } from "@/lib/sources/types";
import { MangaCard } from "./MangaCard";
import { Skeleton } from "@/components/ui/Skeleton";

export function MangaGrid({ items, large = false }: { items: MangaSummary[]; large?: boolean }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No manga found.</p>
    );
  }
  return (
    <div className={large 
      ? "grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      : "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    }>
      {items.map((m) => (
        <MangaCard key={`${m.sourceId}:${m.id}`} manga={m} large={large} />
      ))}
    </div>
  );
}

export function MangaGridSkeleton({ count = 12, large = false }: { count?: number; large?: boolean }) {
  return (
    <div className={large
      ? "grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      : "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    }>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className={large ? "aspect-[2/3] w-full rounded-lg h-64" : "aspect-[2/3] w-full rounded-lg"} />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
      ))}
    </div>
  );
}
