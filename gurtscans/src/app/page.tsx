import { Suspense } from "react";
import Link from "next/link";
import {
  getSource,
  listSources,
  DEFAULT_SOURCE_ID,
} from "@/lib/sources/registry";
import { MangaGrid, MangaGridSkeleton } from "@/components/manga/MangaGrid";
import { SourceError, errorMessage } from "@/components/SourceError";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Search, TrendingUp, BookOpen, Star } from "lucide-react";

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

async function FeaturedSection({ sourceId }: { sourceId: string }) {
  const source = getSource(sourceId);
  try {
    // Get popular manga and randomly select some for featured
    const popular = await source.popular({ limit: 50 });
    if (popular.items.length === 0) {
      return null;
    }
    // Shuffle and take 5 random manga
    const shuffled = [...popular.items].sort(() => Math.random() - 0.5);
    const featured = shuffled.slice(0, 5);
    return <MangaGrid items={featured} large />;
  } catch (err) {
    console.error(`[${sourceId}] featured failed:`, err);
    return null;
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
  const sources = listSources();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-12">
      {/* Hero Section with Search */}
      <section className="space-y-6 py-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Welcome to <span className="text-primary">Gurt Scans</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover and read your favorite manga and manhwa from multiple sources
          </p>
        </div>
        
        {/* Search Bar */}
        <form action="/search" className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Search manga, manhwa, authors..."
              className="h-14 pl-12 text-lg shadow-lg"
            />
            <input type="hidden" name="source" value={sourceId} />
            <Button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6"
            >
              Search
            </Button>
          </div>
        </form>
      </section>

      {/* Source Selection */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight">Choose Your Source</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sources.map((src) => (
            <Link
              key={src.id}
              href={`/?source=${src.id}`}
              className={`p-4 rounded-lg border transition-all hover:shadow-lg hover:shadow-primary/10 ${
                src.id === sourceId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:border-primary/50"
              }`}
            >
              <div className="font-semibold text-center flex items-center justify-center gap-2">
                {src.name}
                {src.id === "mangadna" && (
                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">18+</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Current Source Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Browsing{" "}
          <span className="font-semibold text-primary">{sourceName}</span>
        </p>
      </div>

      {/* Featured Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Star className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight">Next Read?</h2>
        </div>
        <Suspense
          key={`featured:${sourceId}`}
          fallback={<MangaGridSkeleton count={5} />}
        >
          <FeaturedSection sourceId={sourceId} />
        </Suspense>
      </section>

      {/* Popular Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight">Popular</h2>
        </div>
        <Suspense
          key={`popular:${sourceId}`}
          fallback={<MangaGridSkeleton count={12} />}
        >
          <PopularSection sourceId={sourceId} />
        </Suspense>
      </section>

      {/* Latest Updates Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight">Latest Updates</h2>
        </div>
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
