import {
  readChatContext,
  limitedReply,
  parseDemoRequest,
  toolReply,
} from "@/modules/conversation";
import { claudeConfigured, replyWithClaude } from "@/server/claude/chat";

export const maxDuration = 30;
const headers = { "Cache-Control": "no-store" };
const requests = new Map<string, { count: number; until: number }>();

export function GET() {
  return Response.json(
    { mode: claudeConfigured() ? "claude" : "limited" },
    { headers },
  );
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const target = new URL(request.url);
  // Next's local listener may use localhost internally even when the browser uses 127.0.0.1.
  target.host = request.headers.get("host") ?? target.host;
  if (origin && origin !== target.origin)
    return Response.json(
      { error: "Ogiltigt ursprung." },
      { status: 403, headers },
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json({ error: "Använd JSON." }, { status: 415, headers });
  // A bounded per-instance guard for the demo; shared infrastructure is needed before public operation.
  const now = Date.now();
  for (const [key, value] of requests)
    if (value.until < now) requests.delete(key);
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.slice(0, 80) ??
    "local";
  const current = requests.get(ip) ?? { count: 0, until: now + 60_000 };
  if (current.count >= (claudeConfigured() ? 20 : 120) || requests.size >= 5000)
    return Response.json(
      { error: "Många meddelanden just nu. Vänta en minut och försök igen." },
      { status: 429, headers },
    );
  current.count += 1;
  requests.set(ip, current);
  let context;
  try {
    if (!request.body) throw new Error("Meddelandet saknas.");
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 128_000) {
        await reader.cancel();
        return Response.json(
          { error: "Samtalet är för långt." },
          { status: 413, headers },
        );
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    context = readChatContext(JSON.parse(new TextDecoder().decode(bytes)));
  } catch (cause) {
    return Response.json(
      {
        error: cause instanceof Error ? cause.message : "Ogiltigt meddelande.",
      },
      { status: 400, headers },
    );
  }
  if (parseDemoRequest(context.messages.at(-1)!.content).kind === "menu")
    return Response.json(
      {
        ...toolReply("show_menu", {}, context),
        mode: claudeConfigured() ? "claude" : "limited",
      },
      { headers },
    );
  if (!claudeConfigured())
    return Response.json(limitedReply(context), { headers });
  try {
    return Response.json(await replyWithClaude(context, request.signal), {
      headers,
    });
  } catch {
    return Response.json(
      {
        error:
          "Assistenten kunde inte svara just nu. Försök igen. Dina val är kvar och inget har ändrats.",
      },
      { status: 502, headers },
    );
  }
}
