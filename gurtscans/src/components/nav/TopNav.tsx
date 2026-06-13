"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Search, Library, Home, Moon, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { SourcePicker } from "./SourcePicker";
import type { VisibleSource } from "@/lib/sources/visibility";

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
        "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all duration-200",
        active
          ? "bg-primary text-primary-foreground shadow-md"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground hover:shadow-sm",
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

function SearchForm({
  q,
  setQ,
  onSubmit,
  autoFocus,
  onClose,
}: {
  q: string;
  setQ: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  autoFocus?: boolean;
  onClose?: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="flex w-full items-center gap-2">
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search manga…"
          className="pl-9"
          autoFocus={autoFocus}
        />
      </div>
      {onClose && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </form>
  );
}

export function TopNav({ sources }: { sources: VisibleSource[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = React.useState(params.get("q") ?? "");
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);

  React.useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    const qs = new URLSearchParams({ q: term });
    router.push(`/search?${qs.toString()}`);
    setMobileSearchOpen(false);
  }

  const onReader = pathname.startsWith("/read/");
  if (onReader) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary hover:text-primary/80 transition-colors">
          Gurt Scans
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

        <div className="ml-auto hidden flex-1 max-w-md md:flex">
          <SearchForm q={q} setQ={setQ} onSubmit={onSubmit} />
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Search"
          className="ml-auto md:hidden"
          onClick={() => setMobileSearchOpen((v) => !v)}
        >
          <Search className="h-4 w-4" />
        </Button>

        <SourcePicker sources={sources} />
        <ThemeToggle />
      </div>

      {mobileSearchOpen && (
        <div className="border-t border-border bg-background px-4 py-2 md:hidden">
          <SearchForm
            q={q}
            setQ={setQ}
            onSubmit={onSubmit}
            autoFocus
            onClose={() => setMobileSearchOpen(false)}
          />
        </div>
      )}
    </header>
  );
}
