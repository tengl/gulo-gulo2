import { readSignup } from "@/modules/newsletter";
import { brevoConfig, requestConfirmation } from "@/server/brevo/newsletter";
import { siteUrl } from "@/server/site/config";

const headers = { "Cache-Control": "no-store" };
const unavailable =
  "Anmälan till nyhetsbrevet är inte öppen ännu. Följ oss på Instagram så länge.";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const target = new URL(request.url);
  target.host = request.headers.get("host") ?? target.host;
  if (origin && origin !== target.origin)
    return Response.json({ error: "Ogiltigt ursprung." }, { status: 403, headers });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json({ error: "Använd JSON." }, { status: 415, headers });
  const text = await request.text();
  if (text.length > 2000)
    return Response.json({ error: "För stor anmälan." }, { status: 413, headers });
  let body: unknown = null;
  try {
    body = JSON.parse(text);
  } catch {
    /* Reported as an invalid signup below. */
  }
  const signup = readSignup(body);
  if (signup.kind === "invalid")
    return Response.json({ error: signup.message }, { status: 400, headers });
  if (signup.kind === "ignored") return Response.json({ ok: true }, { headers });
  const config = brevoConfig(new URL("/", siteUrl()).href);
  if (!config)
    return Response.json({ error: unavailable }, { status: 503, headers });
  try {
    if (await requestConfirmation(config, signup.email))
      return Response.json({ ok: true }, { headers });
  } catch {
    /* Timeouts and network errors give the same answer as a refusal. */
  }
  return Response.json(
    { error: "Anmälan gick inte att skicka just nu. Försök igen senare." },
    { status: 502, headers },
  );
}
