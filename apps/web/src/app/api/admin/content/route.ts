import {
  ContentEditError,
  applyContentEdits,
  editableContent,
} from "@/modules/site";
import { contentProblems, isEditable } from "@/server/content/editable";
import { readFile, saveFile } from "@/server/github/content";
import { currentEditor, sameOrigin } from "@/server/github/current";

export const runtime = "nodejs";
const headers = { "cache-control": "no-store" };
const json = (body: object, status = 200) => Response.json(body, { status, headers });

const signedOut = () =>
  json({ error: "Inloggningen med GitHub har gått ut. Logga in igen.", signedOut: true }, 401);

function githubFailure(status: number) {
  if (status === 401) return signedOut();
  return json(
    { error: `GitHub svarade inte som väntat (${status}). Försök igen om en stund.` },
    502,
  );
}

// WEBB-015/016: open a text, or an earlier version of it, for editing. An
// earlier version is opened on top of the current file so a save replaces it.
export async function GET(request: Request) {
  const session = await currentEditor();
  if (!session) return signedOut();
  const params = new URL(request.url).searchParams;
  const file = params.get("fil");
  const version = params.get("version");
  if (!isEditable(file)) return json({ error: "Filen finns inte bland webbplatsens texter." }, 404);
  if (version !== null && !/^[0-9a-f]{40}$/.test(version))
    return json({ error: "Ogiltig version." }, 400);
  const { config, editor } = session;
  try {
    const current = await readFile(config, editor.token, file);
    if ("status" in current) return githubFailure(current.status);
    const opened = version ? await readFile(config, editor.token, file, version) : current;
    if ("status" in opened) return githubFailure(opened.status);
    return json({ sha: current.sha, base: opened.raw, ...editableContent(opened.raw) });
  } catch (error) {
    if (error instanceof ContentEditError) return json({ error: error.message }, 422);
    return json({ error: "Kunde inte nå GitHub. Försök igen om en stund." }, 502);
  }
}

type Save = {
  fil: unknown;
  sha: unknown;
  base: unknown;
  values: unknown;
  body: unknown;
  note: unknown;
};

function readValues(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value);
  if (entries.length > 200 || entries.some(([, field]) => typeof field !== "string")) return null;
  return Object.fromEntries(entries) as Record<string, string>;
}

// WEBB-016/017: check like the build does, then commit only on top of the
// version that was opened.
export async function PUT(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Ogiltigt ursprung." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return json({ error: "Använd JSON." }, 415);
  const session = await currentEditor();
  if (!session) return signedOut();
  const text = await request.text();
  if (text.length > 400_000) return json({ error: "Texten är för stor." }, 413);
  let input: Save;
  try {
    input = JSON.parse(text) as Save;
  } catch {
    return json({ error: "Ogiltig begäran." }, 400);
  }
  const values = readValues(input?.values);
  const { fil: file, sha, base, body, note } = input ?? {};
  if (
    !isEditable(file) ||
    typeof sha !== "string" ||
    !/^[0-9a-f]{40}$/.test(sha) ||
    typeof base !== "string" ||
    typeof body !== "string" ||
    (note !== undefined && typeof note !== "string") ||
    !values
  )
    return json({ error: "Ogiltig begäran." }, 400);
  let raw: string;
  try {
    raw = applyContentEdits(base, values, body);
  } catch (error) {
    if (error instanceof ContentEditError) return json({ error: error.message }, 422);
    throw error;
  }
  const problems = contentProblems(file, raw);
  if (problems.length > 0)
    return json({ error: "Rätta texten innan den sparas.", problems }, 422);
  const summary = typeof note === "string" ? note.trim().slice(0, 500) : "";
  const message = `Ändra ${file} i admin${summary ? `\n\n${summary}` : ""}`;
  const { config, editor } = session;
  try {
    const result = await saveFile(config, editor.token, file, raw, sha, message);
    // GitHub also answers 409 when branch protection refuses a direct commit.
    // Only a newer version of the file is a conflict in the WEBB-017 sense.
    if (result.kind === "conflict") {
      const latest = await readFile(config, editor.token, file);
      if (!("status" in latest) && latest.sha === sha)
        return json(
          {
            error:
              "GitHub tog inte emot ändringen eftersom huvudgrenen är skyddad. Inget sparades. Den som administrerar repot behöver ge textredaktörerna rätt att spara direkt (se docs/deployment.md).",
          },
          502,
        );
    }
    if (result.kind === "conflict")
      return json(
        {
          error:
            "Texten har ändrats sedan du öppnade den, av en agent eller någon annan. Inget sparades. Dina ändringar finns kvar här; öppna den nya versionen och för in dem igen.",
          conflict: true,
        },
        409,
      );
    if (result.kind === "refused") {
      if (result.status === 401) return signedOut();
      return json(
        {
          error:
            result.status === 403 || result.status === 404
              ? "GitHub tog inte emot ändringen. Ditt konto saknar skrivrätt till texterna."
              : `GitHub tog inte emot ändringen (${result.status}). Inget sparades.`,
        },
        502,
      );
    }
    return json({ sha: result.sha, url: result.url, base: raw, ...editableContent(raw) });
  } catch {
    return json({ error: "Kunde inte nå GitHub. Inget sparades; försök igen." }, 502);
  }
}
