import { cookies } from "next/headers";
import { sameOrigin } from "@/server/github/current";
import { editorCookie, editorCookieOptions } from "@/server/github/session";

export async function DELETE(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Ogiltigt ursprung." }, { status: 403 });
  (await cookies()).set(editorCookie, "", { ...editorCookieOptions, maxAge: 0 });
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
