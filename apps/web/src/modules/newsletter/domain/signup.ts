// WEBB-013: an address, explicit consent and an empty bot trap.
export type Signup =
  | { kind: "valid"; email: string }
  | { kind: "ignored" }
  | { kind: "invalid"; message: string };

const address = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function readSignup(input: unknown): Signup {
  const body = (typeof input === "object" && input) || {};
  const { email, consent, website } = body as Record<string, unknown>;
  // A filled trap field means a form-filling bot: answer as if it worked.
  if (typeof website === "string" && website.trim()) return { kind: "ignored" };
  if (consent !== true)
    return {
      kind: "invalid",
      message: "Kryssa i att du vill få nyhetsbrevet för att anmäla dig.",
    };
  const value = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (value.length > 254 || !address.test(value))
    return {
      kind: "invalid",
      message: "Skriv en hel e-postadress, till exempel namn@exempel.se.",
    };
  return { kind: "valid", email: value };
}
