import type { MangaSummary } from "@/lib/sources/types";
import { MangaCard } from "./MangaCard";
import { Skeleton } from "@/components/ui/Skeleton";

export function MangaGrid({ items }: { items: MangaSummary[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No manga found.</p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((m) => (
        <MangaCard key={`${m.sourceId}:${m.id}`} manga={m} />
      ))}
    </div>
  );
}

export function MangaGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[2/3] w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}
