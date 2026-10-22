import { cookies } from "next/headers";
import {
  configuredCode,
  matchesCode,
  issueSession,
  validSession,
  sessionCookie,
  cookieOptions,
} from "@/server/access/session";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
const attempts = new Map<string, { count: number; until: number }>();

function json(body: object, status = 200) {
  return Response.json(body, { status, headers });
}

// BEH-005: require browser same-origin requests, including logout.
function sameOrigin(request: Request): boolean {
  const target = new URL(request.url);
  target.host = request.headers.get("host") ?? target.host;
  return (
    request.headers.get("origin") === target.origin &&
    request.headers.get("sec-fetch-site") !== "cross-site"
  );
}

export async function GET() {
  const token = (await cookies()).get(sessionCookie)?.value;
  return validSession(token, configuredCode())
    ? json({ authenticated: true })
    : json({ authenticated: false }, 401);
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Ogiltigt ursprung." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return json({ error: "Använd JSON." }, 415);
  const code = configuredCode();
  if (!code)
    return json({ error: "Administrationens kod är inte konfigurerad." }, 503);
  const now = Date.now();
  for (const [key, entry] of attempts)
    if (entry.until <= now) attempts.delete(key);
  // A bounded per-instance limit; use shared infrastructure before public operation.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.slice(0, 80) ??
    "local";
  const entry = attempts.get(ip) ?? { count: 0, until: now + 15 * 60_000 };
  if (entry.count >= 8 || attempts.size >= 5000)
    return json(
      { error: "För många försök. Vänta 15 minuter och försök igen." },
      429,
    );
  entry.count += 1;
  attempts.set(ip, entry);
  let candidate: unknown;
  try {
    if (!request.body) throw new Error();
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 2048) {
        await reader.cancel();
        return json({ error: "För stor begäran." }, 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
    candidate =
      body && typeof body === "object" && "code" in body
        ? body.code
        : undefined;
  } catch {
    return json({ error: "Ogiltig begäran." }, 400);
  }
  if (
    typeof candidate !== "string" ||
    candidate.length > 512 ||
    !matchesCode(candidate, code)
  )
    return json({ error: "Fel superadmin-kod." }, 401);
  attempts.delete(ip);
  (await cookies()).set(sessionCookie, issueSession(code), cookieOptions);
  return json({ authenticated: true });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Ogiltigt ursprung." }, 403);
  (await cookies()).set(sessionCookie, "", { ...cookieOptions, maxAge: 0 });
  return json({ authenticated: false });
}
