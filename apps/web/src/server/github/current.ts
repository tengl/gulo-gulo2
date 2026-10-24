import "server-only";
import { cookies } from "next/headers";
import { githubConfig } from "./config";
import { editorCookie, openEditor } from "./session";

export async function currentEditor() {
  const config = githubConfig();
  if (!config) return null;
  const editor = openEditor((await cookies()).get(editorCookie)?.value, config.clientSecret);
  return editor ? { config, editor } : null;
}

// The address the browser used. Next may report another host name (for example
// localhost for 127.0.0.1), and the sign-in cookies only follow the real one.
export function siteAddress(request: Request, path: string): URL {
  const target = new URL(request.url);
  target.host = request.headers.get("host") ?? target.host;
  return new URL(path, target.origin);
}

// Writes and logins must come from this site, not from another page.
export function sameOrigin(request: Request): boolean {
  const target = siteAddress(request, "/");
  return (
    request.headers.get("origin") === target.origin &&
    request.headers.get("sec-fetch-site") !== "cross-site"
  );
}
