import { Suspense } from "react";
import {
  DEFAULT_SOURCE_ID,
  getSource,
  listSources,
} from "@/lib/sources/registry";
import { getVisibleSources } from "@/lib/sources/visibility";
import { MangaGrid, MangaGridSkeleton } from "@/components/manga/MangaGrid";
import { SourceError, errorMessage } from "@/components/SourceError";
import type { MangaSummary } from "@/lib/sources/types";

interface SearchParams {
  q?: string;
  source?: string;
}

function resolveSourceId(raw: string | undefined): string {
  const valid = new Set(listSources().map((s) => s.id));
  if (raw && valid.has(raw)) return raw;
  return DEFAULT_SOURCE_ID;
}

async function SourceResults({
  sourceId,
  sourceName,
  q,
  limit,
}: {
  sourceId: string;
  sourceName: string;
  q: string;
  limit: number;
}) {
  let items: MangaSummary[];
  try {
    const source = getSource(sourceId);
    const res = await source.search(q, { limit });
    items = res.items;
  } catch (err) {
    console.error(`[${sourceId}] search failed:`, err);
    return (
      <SourceError sourceName={sourceName} message={errorMessage(err)} />
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No results from {sourceName}.
      </p>
    );
  }
  return <MangaGrid items={items} />;
}

function SectionHeading({
  sourceName,
  query,
}: {
  sourceName: string;
  query: string;
}) {
  return (
    <h3 className="mb-3 flex items-baseline gap-2 text-lg font-semibold">
      <span>{sourceName}</span>
      <span className="text-xs font-normal text-muted-foreground">
        results for &quot;{query}&quot;
      </span>
    </h3>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, source: sourceParam } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
        <h2 className="text-xl font-semibold">Search</h2>
        <p className="text-sm text-muted-foreground">
          Type a title in the search bar above to find manga.
        </p>
      </div>
    );
  }

  if (sourceParam) {
    const sourceId = resolveSourceId(sourceParam);
    const sourceName = getSource(sourceId).name;
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold">
            Results for &quot;{query}&quot;
          </h2>
          <p className="text-xs text-muted-foreground">
            on{" "}
            <span className="font-medium text-foreground">{sourceName}</span>
          </p>
        </div>
        <Suspense
          key={`${sourceId}:${query}`}
          fallback={<MangaGridSkeleton count={12} />}
        >
          <SourceResults
            sourceId={sourceId}
            sourceName={sourceName}
            q={query}
            limit={30}
          />
        </Suspense>
      </div>
    );
  }

  const visible = getVisibleSources();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-8">
      <h2 className="text-xl font-semibold">
        Results for &quot;{query}&quot;
      </h2>
      <p className="text-xs text-muted-foreground">
        Searching {visible.length} sources in parallel
      </p>
      {visible.map((s) => (
        <section key={s.id}>
          <SectionHeading sourceName={s.name} query={query} />
          <Suspense
            key={`${s.id}:${query}`}
            fallback={<MangaGridSkeleton count={6} />}
          >
            <SourceResults
              sourceId={s.id}
              sourceName={s.name}
              q={query}
              limit={12}
            />
          </Suspense>
        </section>
      ))}
    </div>
  );
}
