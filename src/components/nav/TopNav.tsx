"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Search, Library, Home, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { SourcePicker } from "./SourcePicker";
import { usePrefs } from "@/lib/storage/preferences";

const SOURCES = [
  { id: "mangadex", name: "MangaDex" },
  { id: "comick", name: "Comick" },
  { id: "weebcentral", name: "WeebCentral" },
  { id: "asura", name: "AsuraScans" },
];

function NavLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: typeof Home;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-10 w-10" />;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const activeSourceId = usePrefs((s) => s.activeSourceId);
  const [q, setQ] = React.useState(params.get("q") ?? "");

  React.useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    const source = params.get("source") ?? activeSourceId;
    const qs = new URLSearchParams({ q: term });
    if (source) qs.set("source", source);
    router.push(`/search?${qs.toString()}`);
  }

  const onReader = pathname.startsWith("/read/");
  if (onReader) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Tachiyul
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink
            href="/"
            icon={Home}
            label="Home"
            active={pathname === "/"}
          />
          <NavLink
            href="/library"
            icon={Library}
            label="Library"
            active={pathname.startsWith("/library")}
          />
        </nav>
        <form onSubmit={onSubmit} className="ml-auto flex max-w-md flex-1">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search manga…"
              className="pl-9"
            />
          </div>
        </form>
        <SourcePicker sources={SOURCES} />
        <ThemeToggle />
      </div>
    </header>
  );
}
