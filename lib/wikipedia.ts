import type { CardImage } from "./types";

const USER_AGENT = "Mindful/0.1 (learning-card PWA; +https://github.com/)";

type SummaryResponse = {
  type?: string;
  title?: string;
  thumbnail?: { source: string; width: number; height: number };
  originalimage?: { source: string; width: number; height: number };
  content_urls?: { desktop?: { page?: string } };
  extract?: string;
};

type ImageInfoResponse = {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        imageinfo?: Array<{
          descriptionurl?: string;
          extmetadata?: Record<string, { value?: string }>;
        }>;
      }
    >;
  };
};

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Clean Wikidata template artifacts that sometimes leak through the HTML
 * parser, e.g. "(† circa 1796date QS:P,+1796-00-00T00:00:00Z/9,P1480,Q5727902)".
 */
function cleanArtist(s: string): string {
  return s
    .replace(/\(†[^)]*\)?/g, "") // dagger-marked life dates
    .replace(/date QS:[^\s)]+/g, "") // raw Wikidata date templates
    .replace(/Q\d{4,}/g, "") // bare Wikidata Q-IDs
    .replace(/P\d{3,}/g, "") // bare Wikidata P-IDs
    .replace(/\s+/g, " ")
    .replace(/\s*[(,]\s*$/g, "")
    .trim();
}

/**
 * Pull the underlying file name from a Wikimedia upload URL. The original
 * image URL is /wikipedia/commons/X/XX/Filename.ext; the thumbnail variant is
 * /wikipedia/commons/thumb/X/XX/Filename.ext/640px-Filename.ext.
 */
function fileNameFromUploadUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const thumbIdx = parts.indexOf("thumb");
    if (thumbIdx >= 0) {
      // For thumb URLs, the file name is the segment right before the resized variant.
      return decodeURIComponent(parts[parts.length - 2] ?? "") || null;
    }
    return decodeURIComponent(parts[parts.length - 1] ?? "") || null;
  } catch {
    return null;
  }
}

async function fetchSummary(title: string): Promise<SummaryResponse | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "application/json" } });
  if (!res.ok) return null;
  return (await res.json()) as SummaryResponse;
}

/**
 * Build a canonical Wikipedia article URL from a title without an HTTP call.
 * Used for seed cards where we trust the curated title and don't need to verify.
 */
export function wikipediaArticleUrl(title: string): string {
  const slug = title.trim().replace(/\s+/g, "_");
  return `https://en.wikipedia.org/wiki/${encodeURI(slug)}`;
}

async function fetchImageInfo(filename: string): Promise<ImageInfoResponse | null> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    titles: `File:${filename}`,
    formatversion: "1",
    origin: "*",
  });
  const url = `https://en.wikipedia.org/w/api.php?${params.toString()}`;
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "application/json" } });
  if (!res.ok) return null;
  return (await res.json()) as ImageInfoResponse;
}

async function imageFromSummary(summary: SummaryResponse): Promise<CardImage | null> {
  // Some pages legitimately have no image (e.g. abstract concepts).
  const display = summary.thumbnail ?? summary.originalimage;
  const original = summary.originalimage ?? summary.thumbnail;
  if (!display || !original) return null;

  const filename = fileNameFromUploadUrl(original.source) ?? fileNameFromUploadUrl(display.source);
  if (!filename) return null;

  const info = await fetchImageInfo(filename);
  const pages = info?.query?.pages ?? {};
  const page = Object.values(pages)[0];
  const ii = page?.imageinfo?.[0];
  const meta = ii?.extmetadata ?? {};
  const licenseRaw = meta["LicenseShortName"]?.value ?? meta["License"]?.value;
  const licenseUrl = meta["LicenseUrl"]?.value;
  const artistRaw = meta["Artist"]?.value;
  const sourceUrl = ii?.descriptionurl;

  if (!licenseRaw || !sourceUrl) return null;
  const license = stripHtml(licenseRaw).slice(0, 60);
  const author = artistRaw
    ? cleanArtist(stripHtml(artistRaw)).slice(0, 120) || "Unknown"
    : "Unknown";
  const pageUrl = summary.content_urls?.desktop?.page;
  const alt = summary.title ?? "";

  return {
    kind: "url",
    url: display.source,
    alt,
    license,
    licenseUrl: licenseUrl && /^https?:/.test(licenseUrl) ? licenseUrl : pageUrl ?? sourceUrl,
    author,
    sourceUrl,
  };
}

export type WikipediaArticle = {
  pageUrl: string;
  articleTitle: string;
  image: CardImage | null;
};

/**
 * Verify a Wikipedia article exists and return its canonical URL, title, and
 * (optionally) a CardImage with attribution. Returns null if the article does
 * not exist — useful as a hallucination guard for model-generated content.
 */
export async function fetchWikipediaArticle(title: string): Promise<WikipediaArticle | null> {
  const summary = await fetchSummary(title);
  if (!summary) return null;
  const pageUrl = summary.content_urls?.desktop?.page;
  const articleTitle = summary.title;
  if (!pageUrl || !articleTitle) return null;
  const image = await imageFromSummary(summary);
  return { pageUrl, articleTitle, image };
}

/**
 * Resolve a Wikipedia article title to a CardImage with proper attribution.
 * Returns null if the page has no image, the lookup fails, or the license is
 * unrecognised. Caller should fall back to a gradient image.
 */
export async function fetchWikipediaImage(title: string): Promise<CardImage | null> {
  const article = await fetchWikipediaArticle(title);
  return article?.image ?? null;
}
