import { AlertTriangle } from "lucide-react";

export function SourceError({
  sourceName,
  message,
}: {
  sourceName: string;
  message: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-sm">
      <div className="flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        Couldn&apos;t reach {sourceName}
      </div>
      <p className="mt-2 text-xs text-muted-foreground break-words">
        {message}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Try switching the source in the top-right picker, or check your network.
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
