import { AlertTriangle } from "lucide-react";

function classifyError(message: string): string | null {
  if (/HTTP 403/.test(message) || /forbidden/i.test(message)) {
    return "This source likely blocks hosted/datacenter IPs (Vercel, AWS, etc.) at the Cloudflare layer. It typically works in local dev but not in production. MangaDex is unaffected because it offers a public API.";
  }
  if (/HTTP 404/.test(message)) {
    return "The source's URL structure may have changed (scraper sites change layouts often). The selectors need updating.";
  }
  if (/ENOTFOUND|getaddrinfo/i.test(message)) {
    return "DNS resolution failed — your network or ISP may be blocking the domain. Try a different DNS or VPN.";
  }
  if (/HTTP 5\d\d/.test(message) || /timeout/i.test(message)) {
    return "The source's server may be down or slow. Try again in a moment.";
  }
  return null;
}

export function SourceError({
  sourceName,
  message,
}: {
  sourceName: string;
  message: string;
}) {
  const hint = classifyError(message);
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-sm space-y-2">
      <div className="flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        Couldn&apos;t reach {sourceName}
      </div>
      <p className="text-xs text-muted-foreground break-words">{message}</p>
      {hint && (
        <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Switch the source in the top-right picker, or try MangaDex which works reliably in production.
      </p>
    </div>
  );
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message || err.name || "Unknown error";
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}
