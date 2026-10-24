import "server-only";

// WEBB-015/018: a GitHub App lets the staff who edit texts sign in with their
// own GitHub account. Commits are made with their token, in their name.
export type GitHubConfig = {
  clientId: string;
  clientSecret: string;
  repo: string;
  branch: string;
  webUrl: string;
  apiUrl: string;
};

// Where the site's texts live in the repository.
export const contentRoot = "apps/web/content";

export function githubConfig(): GitHubConfig | null {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const repo = process.env.GITHUB_CONTENT_REPO;
  if (!clientId || !clientSecret || clientSecret.length < 20) return null;
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) return null;
  return {
    clientId,
    clientSecret,
    repo,
    branch: process.env.GITHUB_CONTENT_BRANCH || "main",
    // Overridden only by the browser tests, which run against a local fake.
    webUrl: process.env.GITHUB_WEB_URL || "https://github.com",
    apiUrl: process.env.GITHUB_API_URL || "https://api.github.com",
  };
}
