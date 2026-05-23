export function proxied(url: string | null | undefined): string {
  if (!url) return "";
  return `/api/image?url=${encodeURIComponent(url)}`;
}
