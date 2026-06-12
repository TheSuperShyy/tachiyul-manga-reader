import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center space-y-3">
      <h1 className="text-3xl font-semibold">Not found</h1>
      <p className="text-sm text-muted-foreground">
        We couldn&apos;t find what you were looking for.
      </p>
      <Link
        href="/"
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        Back home
      </Link>
    </div>
  );
}
