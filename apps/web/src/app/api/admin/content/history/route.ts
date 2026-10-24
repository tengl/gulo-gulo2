import { isEditable } from "@/server/content/editable";
import { history } from "@/server/github/content";
import { currentEditor } from "@/server/github/current";

export const runtime = "nodejs";
const headers = { "cache-control": "no-store" };

// WEBB-016: earlier versions of a text, newest first.
export async function GET(request: Request) {
  const session = await currentEditor();
  if (!session)
    return Response.json(
      { error: "Inloggningen med GitHub har gått ut. Logga in igen.", signedOut: true },
      { status: 401, headers },
    );
  const file = new URL(request.url).searchParams.get("fil");
  if (!isEditable(file))
    return Response.json({ error: "Filen finns inte bland webbplatsens texter." }, { status: 404, headers });
  try {
    const versions = await history(session.config, session.editor.token, file);
    if ("status" in versions)
      return Response.json({ error: "Kunde inte hämta tidigare versioner." }, { status: 502, headers });
    return Response.json({ versions }, { headers });
  } catch {
    return Response.json({ error: "Kunde inte nå GitHub." }, { status: 502, headers });
  }
}
