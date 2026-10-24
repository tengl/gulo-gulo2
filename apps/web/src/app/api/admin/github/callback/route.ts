import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { githubConfig } from "@/server/github/config";
import { account, exchangeCode } from "@/server/github/content";
import { siteAddress } from "@/server/github/current";
import {
  editorCookie,
  editorCookieOptions,
  sealEditor,
  stateCookie,
} from "@/server/github/session";

export const runtime = "nodejs";

function back(request: Request, problem?: string) {
  const url = siteAddress(request, "/admin/texter");
  if (problem) url.searchParams.set("fel", problem);
  return new Response(null, {
    status: 303,
    headers: { location: url.pathname + url.search, "cache-control": "no-store" },
  });
}

function matches(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

// WEBB-018: GitHub returns here; only accounts with write access get a session.
export async function GET(request: Request) {
  const config = githubConfig();
  if (!config) return back(request);
  const store = await cookies();
  const expected = store.get(stateCookie)?.value;
  store.delete(stateCookie);
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state || !expected || !matches(state, expected))
    return back(request, "inloggning");
  try {
    const callback = siteAddress(request, "/api/admin/github/callback").href;
    const token = await exchangeCode(config, code, callback);
    if (!token) return back(request, "inloggning");
    const person = await account(config, token);
    if (!person) return back(request, "inloggning");
    if (!person.canWrite) return back(request, "behorighet");
    store.set(
      editorCookie,
      sealEditor({ token, login: person.login, name: person.name }, config.clientSecret),
      editorCookieOptions,
    );
    return back(request);
  } catch {
    return back(request, "github");
  }
}
