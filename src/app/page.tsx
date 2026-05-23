import { Suspense } from "react";
import {
  getSource,
  listSources,
  DEFAULT_SOURCE_ID,
} from "@/lib/sources/registry";
import { MangaGrid, MangaGridSkeleton } from "@/components/manga/MangaGrid";
import { SourceError, errorMessage } from "@/components/SourceError";

export const revalidate = 300;

interface SearchParams {
  source?: string;
}

function resolveSourceId(raw: string | undefined): string {
  const valid = new Set(listSources().map((s) => s.id));
  if (raw && valid.has(raw)) return raw;
  return DEFAULT_SOURCE_ID;
}

async function PopularSection({ sourceId }: { sourceId: string }) {
  const source = getSource(sourceId);
  try {
    const popular = await source.popular({ limit: 24 });
    if (popular.items.length === 0) {
      return (
        <SourceError
          sourceName={source.name}
          message="No popular results returned (the source's listing may have changed structure)."
        />
      );
    }
    return <MangaGrid items={popular.items} />;
  } catch (err) {
    console.error(`[${sourceId}] popular failed:`, err);
    return (
      <SourceError sourceName={source.name} message={errorMessage(err)} />
    );
  }
}

async function LatestSection({ sourceId }: { sourceId: string }) {
  const source = getSource(sourceId);
  try {
    const latest = await source.latest({ limit: 12 });
    if (latest.items.length === 0) {
      return (
        <SourceError
          sourceName={source.name}
          message="No latest results returned (the source's listing may have changed structure)."
        />
      );
    }
    return <MangaGrid items={latest.items} />;
  } catch (err) {
    console.error(`[${sourceId}] latest failed:`, err);
    return (
      <SourceError sourceName={source.name} message={errorMessage(err)} />
    );
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { source } = await searchParams;
  const sourceId = resolveSourceId(source);
  const sourceName = getSource(sourceId).name;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-10">
      <p className="text-xs text-muted-foreground">
        Browsing{" "}
        <span className="font-medium text-foreground">{sourceName}</span>
      </p>
      <section>
        <h2 className="mb-4 text-xl font-semibold">Popular</h2>
        <Suspense
          key={`popular:${sourceId}`}
          fallback={<MangaGridSkeleton count={12} />}
        >
          <PopularSection sourceId={sourceId} />
        </Suspense>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold">Latest updates</h2>
        <Suspense
          key={`latest:${sourceId}`}
          fallback={<MangaGridSkeleton count={6} />}
        >
          <LatestSection sourceId={sourceId} />
        </Suspense>
      </section>
    </div>
  );
}
