import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { githubConfig } from "@/server/github/config";
import { authorizeUrl } from "@/server/github/content";
import { siteAddress } from "@/server/github/current";
import { stateCookie } from "@/server/github/session";

export const runtime = "nodejs";

// WEBB-018: sign in with the person's own GitHub account.
export async function GET(request: Request) {
  const config = githubConfig();
  if (!config) return Response.redirect(siteAddress(request, "/admin/texter"), 303);
  const state = randomBytes(24).toString("base64url");
  (await cookies()).set(stateCookie, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  const callback = siteAddress(request, "/api/admin/github/callback").href;
  return new Response(null, {
    status: 303,
    headers: {
      location: authorizeUrl(config, callback, state).href,
      "cache-control": "no-store",
    },
  });
}
