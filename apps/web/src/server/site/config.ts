import "server-only";

// WEBB-014: only the production site is indexed. The Netlify demo and previews
// leave SITE_INDEXABLE unset so they never compete with gulogulo.se in search.
export function siteUrl(): URL {
  return new URL(process.env.SITE_URL || "https://www.gulogulo.se");
}

export function siteIndexable(): boolean {
  return process.env.SITE_INDEXABLE === "true";
}
