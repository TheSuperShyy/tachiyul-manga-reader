import { Suspense } from "react";
import {
  DEFAULT_SOURCE_ID,
  getSource,
  listSources,
} from "@/lib/sources/registry";
import { MangaGrid, MangaGridSkeleton } from "@/components/manga/MangaGrid";
import { SourceError, errorMessage } from "@/components/SourceError";

interface SearchParams {
  q?: string;
  source?: string;
}

function resolveSourceId(raw: string | undefined): string {
  const valid = new Set(listSources().map((s) => s.id));
  if (raw && valid.has(raw)) return raw;
  return DEFAULT_SOURCE_ID;
}

async function Results({ q, sourceId }: { q: string; sourceId: string }) {
  const source = getSource(sourceId);
  try {
    const res = await source.search(q, { limit: 30 });
    if (res.items.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No results from {source.name} for &quot;{q}&quot;.
        </p>
      );
    }
    return <MangaGrid items={res.items} />;
  } catch (err) {
    console.error(`[${sourceId}] search failed:`, err);
    return (
      <SourceError sourceName={source.name} message={errorMessage(err)} />
    );
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, source } = await searchParams;
  const query = q?.trim() ?? "";
  const sourceId = resolveSourceId(source);
  const sourceName = getSource(sourceId).name;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">
          {query ? `Results for "${query}"` : "Search"}
        </h2>
        <p className="text-xs text-muted-foreground">
          on <span className="font-medium text-foreground">{sourceName}</span>
        </p>
      </div>
      {query ? (
        <Suspense
          key={`${sourceId}:${query}`}
          fallback={<MangaGridSkeleton count={12} />}
        >
          <Results q={query} sourceId={sourceId} />
        </Suspense>
      ) : (
        <p className="text-sm text-muted-foreground">
          Type a title in the search bar above to find manga.
        </p>
      )}
    </div>
  );
}
