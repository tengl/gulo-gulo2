import "server-only";
import { contentRoot, type GitHubConfig } from "./config.ts";

// WEBB-015–018: every read and write uses the signed-in person's own token,
// so GitHub decides what they may do and records the commit in their name.

type Send = typeof fetch;

function headers(token: string) {
  return {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "gulo-gulo-admin",
  };
}

function api(config: GitHubConfig, path: string) {
  return new URL(path.replace(/^\//, ""), `${config.apiUrl.replace(/\/$/, "")}/`);
}

function contentUrl(config: GitHubConfig, file: string, ref?: string) {
  const url = api(config, `repos/${config.repo}/contents/${contentRoot}/${file}`);
  if (ref) url.searchParams.set("ref", ref);
  return url;
}

export function authorizeUrl(config: GitHubConfig, redirectUri: string, state: string): URL {
  const url = new URL("/login/oauth/authorize", config.webUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("allow_signup", "false");
  return url;
}

export async function exchangeCode(
  config: GitHubConfig,
  code: string,
  redirectUri: string,
  send: Send = fetch,
): Promise<string | null> {
  const response = await send(new URL("/login/oauth/access_token", config.webUrl), {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;
  const body = (await response.json().catch(() => null)) as { access_token?: unknown } | null;
  return typeof body?.access_token === "string" ? body.access_token : null;
}

export type Account = { login: string; name: string; canWrite: boolean };

// WEBB-018: only people with write access to the repository may edit texts.
export async function account(
  config: GitHubConfig,
  token: string,
  send: Send = fetch,
): Promise<Account | null> {
  const [user, repo] = await Promise.all(
    [api(config, "user"), api(config, `repos/${config.repo}`)].map((url) =>
      send(url, { headers: headers(token), signal: AbortSignal.timeout(8000) }),
    ),
  );
  if (!user!.ok) return null;
  const person = (await user!.json()) as { login?: unknown; name?: unknown };
  if (typeof person.login !== "string") return null;
  const permissions = repo!.ok
    ? ((await repo!.json()) as { permissions?: { push?: unknown } }).permissions
    : undefined;
  return {
    login: person.login,
    name: typeof person.name === "string" && person.name ? person.name : person.login,
    canWrite: permissions?.push === true,
  };
}

export type FileVersion = { raw: string; sha: string };

export async function readFile(
  config: GitHubConfig,
  token: string,
  file: string,
  ref = config.branch,
  send: Send = fetch,
): Promise<FileVersion | { status: number }> {
  const response = await send(contentUrl(config, file, ref), {
    headers: headers(token),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return { status: response.status };
  const body = (await response.json()) as { content?: unknown; sha?: unknown; encoding?: unknown };
  if (typeof body.content !== "string" || typeof body.sha !== "string" || body.encoding !== "base64")
    return { status: 502 };
  return { raw: Buffer.from(body.content, "base64").toString("utf8"), sha: body.sha };
}

export type Version = { commit: string; date: string; author: string; message: string };

export async function history(
  config: GitHubConfig,
  token: string,
  file: string,
  send: Send = fetch,
): Promise<Version[] | { status: number }> {
  const url = api(config, `repos/${config.repo}/commits`);
  url.searchParams.set("path", `${contentRoot}/${file}`);
  url.searchParams.set("sha", config.branch);
  url.searchParams.set("per_page", "15");
  const response = await send(url, {
    headers: headers(token),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return { status: response.status };
  const commits = (await response.json()) as {
    sha: string;
    author?: { login?: string } | null;
    commit: { message: string; author?: { name?: string; date?: string } | null };
  }[];
  return commits.map((entry) => ({
    commit: entry.sha,
    date: entry.commit.author?.date ?? "",
    author: entry.author?.login ?? entry.commit.author?.name ?? "okänd",
    message: entry.commit.message.split("\n")[0]!.slice(0, 200),
  }));
}

export type SaveResult =
  | { kind: "saved"; sha: string; url: string | null }
  | { kind: "conflict" }
  | { kind: "refused"; status: number };

// WEBB-017: GitHub only accepts the write when sha is still the file's current
// version. Anything else means someone changed it after it was opened.
export async function saveFile(
  config: GitHubConfig,
  token: string,
  file: string,
  raw: string,
  sha: string,
  message: string,
  send: Send = fetch,
): Promise<SaveResult> {
  const response = await send(contentUrl(config, file), {
    method: "PUT",
    headers: { ...headers(token), "content-type": "application/json" },
    body: JSON.stringify({
      message,
      content: Buffer.from(raw, "utf8").toString("base64"),
      sha,
      branch: config.branch,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 409) return { kind: "conflict" };
  if (!response.ok) return { kind: "refused", status: response.status };
  const body = (await response.json().catch(() => null)) as {
    content?: { sha?: string };
    commit?: { html_url?: string };
  } | null;
  // The new version's sha is what the next save must build on.
  if (typeof body?.content?.sha !== "string") return { kind: "refused", status: 502 };
  return { kind: "saved", sha: body.content.sha, url: body.commit?.html_url ?? null };
}
