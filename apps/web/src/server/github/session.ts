import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";

// WEBB-018: the GitHub token stays on the server side of the browser. The
// cookie holds it encrypted with a key derived from the GitHub App secret.
export type Editor = { token: string; login: string; name: string };

// GitHub App user tokens expire after eight hours; the session does too.
export const editorSeconds = 8 * 60 * 60;
const production = process.env.NODE_ENV === "production";
export const editorCookie = production ? "__Host-gulo-texter" : "gulo-texter";
export const stateCookie = production ? "__Host-gulo-texter-state" : "gulo-texter-state";

// Lax, because GitHub sends the browser back here with a cross-site redirect.
// Changes are protected by the same-origin check on every write route.
export const editorCookieOptions = {
  httpOnly: true,
  secure: production,
  sameSite: "lax" as const,
  path: "/",
  maxAge: editorSeconds,
};

function key(secret: string): Buffer {
  return Buffer.from(hkdfSync("sha256", secret, "gulo-texter", "editor-session-v1", 32));
}

export function sealEditor(editor: Editor, secret: string, now = Date.now()): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  const payload = JSON.stringify({ ...editor, until: Math.floor(now / 1000) + editorSeconds });
  const sealed = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), sealed].map((part) => part.toString("base64url")).join(".");
}

export function openEditor(
  value: string | undefined,
  secret: string | undefined,
  now = Date.now(),
): Editor | null {
  if (!value || !secret || value.length > 3000) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  try {
    const [iv, tag, sealed] = parts.map((part) => Buffer.from(part, "base64url")) as [Buffer, Buffer, Buffer];
    const decipher = createDecipheriv("aes-256-gcm", key(secret), iv);
    decipher.setAuthTag(tag);
    const payload: unknown = JSON.parse(
      Buffer.concat([decipher.update(sealed), decipher.final()]).toString("utf8"),
    );
    if (!payload || typeof payload !== "object") return null;
    const { token, login, name, until } = payload as Record<string, unknown>;
    if (typeof token !== "string" || typeof login !== "string" || typeof name !== "string")
      return null;
    if (typeof until !== "number" || until <= Math.floor(now / 1000)) return null;
    return { token, login, name };
  } catch {
    return null;
  }
}
