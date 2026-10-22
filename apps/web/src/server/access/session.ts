import "server-only";
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

// BEH-005: only server code handles the shared code and signing material.
export const sessionSeconds = 8 * 60 * 60;
export const sessionCookie =
  process.env.NODE_ENV === "production" ? "__Host-gulo-admin" : "gulo-admin";

export function configuredCode(): string | undefined {
  const code = process.env.ADMIN_ACCESS_CODE;
  return code && code.trim().length >= 16 && code.length <= 512
    ? code
    : undefined;
}

export function matchesCode(candidate: string, expected: string): boolean {
  const hash = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(candidate), hash(expected));
}

function signature(payload: string, code: string): string {
  return createHmac("sha256", code)
    .update(`gulo-admin-v1:${payload}`)
    .digest("base64url");
}

export function issueSession(code: string, now = Date.now()): string {
  const payload = `${Math.floor(now / 1000)}.${randomBytes(24).toString("base64url")}`;
  return `${payload}.${signature(payload, code)}`;
}

export function validSession(
  token: string | undefined,
  code: string | undefined,
  now = Date.now(),
): boolean {
  if (!code || !token || token.length > 200) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [issued, nonce, signed] = parts as [string, string, string];
  if (
    !/^\d{10}$/.test(issued) ||
    !/^[\w-]{32}$/.test(nonce) ||
    !/^[\w-]{43}$/.test(signed)
  )
    return false;
  const age = Math.floor(now / 1000) - Number(issued);
  return (
    age >= 0 &&
    age < sessionSeconds &&
    matchesCode(signed, signature(`${issued}.${nonce}`, code))
  );
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: sessionSeconds,
};
