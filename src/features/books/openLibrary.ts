import type { BookDraft } from "./types";
import { optimizeImage } from "../../utils/image";

export type OpenLibraryResult = {
  key?: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
  publisher?: string[];
};

type SearchDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
  publisher?: string[];
};

type SearchResponse = {
  docs?: SearchDoc[];
};

const SEARCH_FIELDS =
  "key,title,author_name,first_publish_year,isbn,cover_i,publisher";

function normalizeDoc(doc: SearchDoc): OpenLibraryResult | null {
  const title = doc.title?.trim();
  if (!title) return null;
  return {
    key: doc.key,
    title,
    author_name: doc.author_name,
    first_publish_year: doc.first_publish_year,
    isbn: doc.isbn,
    cover_i: doc.cover_i,
    publisher: doc.publisher,
  };
}

export function normalizeIsbn(raw: string): string {
  return raw.replace(/[^0-9Xx]/g, "").toUpperCase();
}

export function pickIsbn(isbns?: string[]): string | undefined {
  if (!isbns?.length) return undefined;
  const cleaned = isbns.map((entry) => normalizeIsbn(entry)).filter(Boolean);
  const isbn13 = cleaned.find((entry) => entry.length === 13);
  if (isbn13) return isbn13;
  const isbn10 = cleaned.find((entry) => entry.length === 10);
  if (isbn10) return isbn10;
  return cleaned[0];
}

export function coverUrlForResult(
  result: OpenLibraryResult,
  size: "S" | "M" | "L" = "L",
): string | undefined {
  if (result.cover_i) {
    return `https://covers.openlibrary.org/b/id/${result.cover_i}-${size}.jpg`;
  }
  const isbn = pickIsbn(result.isbn);
  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`;
  }
  return undefined;
}

async function fetchCoverDataUrl(
  url: string,
  signal?: AbortSignal,
): Promise<string | undefined> {
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) return undefined;
    const blob = await response.blob();
    const optimized = await optimizeImage(blob);
    return optimized.full;
  } catch {
    return undefined;
  }
}

export async function searchOpenLibrary(
  query: string,
  options?: { limit?: number; signal?: AbortSignal },
): Promise<OpenLibraryResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("limit", String(options?.limit ?? 10));
  url.searchParams.set("fields", SEARCH_FIELDS);

  const response = await fetch(url, { signal: options?.signal });
  if (!response.ok) {
    throw new Error(`Open Library search failed (${response.status})`);
  }

  const data = (await response.json()) as SearchResponse;
  return (data.docs ?? [])
    .map((doc) => normalizeDoc(doc))
    .filter((entry): entry is OpenLibraryResult => entry !== null);
}

export async function lookupIsbn(
  rawIsbn: string,
  signal?: AbortSignal,
): Promise<OpenLibraryResult | null> {
  const isbn = normalizeIsbn(rawIsbn);
  if (!isbn) return null;

  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("isbn", isbn);
  url.searchParams.set("limit", "1");
  url.searchParams.set("fields", SEARCH_FIELDS);

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Open Library ISBN lookup failed (${response.status})`);
  }

  const data = (await response.json()) as SearchResponse;
  const doc = data.docs?.[0];
  if (!doc) return null;
  const result = normalizeDoc(doc);
  if (!result) return null;
  return {
    ...result,
    isbn: result.isbn?.length ? result.isbn : [isbn],
  };
}

export function resultToBookDraftBase(result: OpenLibraryResult): BookDraft {
  return {
    title: result.title,
    author: result.author_name?.filter(Boolean).join(", "),
    isbn: pickIsbn(result.isbn),
    publisher: result.publisher?.[0],
    publishedYear: result.first_publish_year,
  };
}

export async function toBookDraft(
  result: OpenLibraryResult,
  options?: { signal?: AbortSignal },
): Promise<BookDraft> {
  const base = resultToBookDraftBase(result);
  const coverUrl = coverUrlForResult(result);
  if (!coverUrl) return base;

  const coverImage = await fetchCoverDataUrl(coverUrl, options?.signal);
  return coverImage ? { ...base, coverImage } : base;
}
