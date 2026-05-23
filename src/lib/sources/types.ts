export interface MangaSummary {
  sourceId: string;
  id: string;
  title: string;
  coverUrl: string | null;
}

export interface MangaDetail extends MangaSummary {
  description: string;
  tags: string[];
  status: string;
  authors: string[];
  artists: string[];
  originalLanguage: string;
  year: number | null;
  altTitles: string[];
}

export interface Chapter {
  id: string;
  number: string | null;
  volume: string | null;
  title: string | null;
  lang: string;
  publishedAt: string;
  pages: number;
  groupName: string | null;
}

export interface PageList {
  chapterId: string;
  urls: string[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface ListOpts {
  limit?: number;
  offset?: number;
}

export interface SearchOpts extends ListOpts {
  includedTags?: string[];
  excludedTags?: string[];
}

export interface ChapterOpts extends ListOpts {
  languages?: string[];
  order?: "asc" | "desc";
}

export interface MangaSource {
  readonly id: string;
  readonly name: string;
  readonly languages: string[];

  search(query: string, opts?: SearchOpts): Promise<Paginated<MangaSummary>>;
  popular(opts?: ListOpts): Promise<Paginated<MangaSummary>>;
  latest(opts?: ListOpts): Promise<Paginated<MangaSummary>>;
  getManga(mangaId: string): Promise<MangaDetail>;
  getChapters(mangaId: string, opts?: ChapterOpts): Promise<Paginated<Chapter>>;
  getPages(chapterId: string): Promise<PageList>;
}
