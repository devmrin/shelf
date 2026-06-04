import type { BookDraft } from "./types";
import { optimizeImage } from "../../utils/image";

export type OpenLibraryResult = {
  key?: string;
  title: string;
  subtitle?: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
  publisher?: string[];
};

type EditionDoc = {
  key?: string;
  title?: string;
  subtitle?: string;
  cover_i?: number;
};

type SearchDoc = {
  key?: string;
  title?: string;
  subtitle?: string;
  name?: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
  publisher?: string[];
  editions?: {
    docs?: EditionDoc[];
  };
};

type SearchResponse = {
  docs?: SearchDoc[];
};

/** Matches Open Library site search (edition titles for ISBN / work queries). */
const SEARCH_FIELDS =
  "key,cover_i,title,subtitle,author_name,first_publish_year,isbn,editions,publisher";

function pickPrimaryEdition(doc: SearchDoc): EditionDoc | undefined {
  const editions = doc.editions?.docs;
  if (!editions?.length) return undefined;
  return editions.find((entry) => entry.title?.trim()) ?? editions[0];
}

function joinTitleAndSubtitle(title: string, subtitle?: string): string {
  const trimmedSubtitle = subtitle?.trim();
  if (!trimmedSubtitle) return title;
  return `${title}: ${trimmedSubtitle}`;
}

/** Prefer edition title (e.g. English) over canonical work title (often another language). */
function resolveTitle(doc: SearchDoc, edition?: EditionDoc): string | null {
  if (edition?.title?.trim()) {
    return joinTitleAndSubtitle(edition.title.trim(), edition.subtitle);
  }

  const workTitle = doc.title?.trim();
  if (workTitle) {
    return joinTitleAndSubtitle(workTitle, doc.subtitle);
  }

  return doc.name?.trim() ?? null;
}

function normalizeDoc(doc: SearchDoc): OpenLibraryResult | null {
  const edition = pickPrimaryEdition(doc);
  const title = resolveTitle(doc, edition);
  if (!title) return null;

  const subtitle = edition?.subtitle?.trim() ?? doc.subtitle?.trim();

  return {
    key: edition?.key ?? doc.key,
    title,
    subtitle: subtitle || undefined,
    author_name: doc.author_name,
    first_publish_year: doc.first_publish_year,
    isbn: doc.isbn,
    cover_i: edition?.cover_i ?? doc.cover_i,
    publisher: doc.publisher,
  };
}

function buildSearchUrl(
  params: Record<string, string>,
  options?: { limit?: number; signal?: AbortSignal },
): URL {
  const url = new URL("https://openlibrary.org/search.json");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("limit", String(options?.limit ?? 10));
  url.searchParams.set("fields", SEARCH_FIELDS);
  url.searchParams.set("mode", "everything");
  return url;
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

async function fetchSearch(
  params: Record<string, string>,
  options?: { limit?: number; signal?: AbortSignal },
): Promise<OpenLibraryResult[]> {
  const url = buildSearchUrl(params, options);
  const response = await fetch(url, { signal: options?.signal });
  if (!response.ok) {
    throw new Error(`Open Library search failed (${response.status})`);
  }

  const data = (await response.json()) as SearchResponse;
  return (data.docs ?? [])
    .map((doc) => normalizeDoc(doc))
    .filter((entry): entry is OpenLibraryResult => entry !== null);
}

export async function searchOpenLibrary(
  query: string,
  options?: { limit?: number; signal?: AbortSignal },
): Promise<OpenLibraryResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return fetchSearch({ q: trimmed }, options);
}

export async function lookupIsbn(
  rawIsbn: string,
  signal?: AbortSignal,
): Promise<OpenLibraryResult | null> {
  const isbn = normalizeIsbn(rawIsbn);
  if (!isbn) return null;

  const results = await fetchSearch({ q: isbn }, { limit: 1, signal });
  const result = results[0];
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
