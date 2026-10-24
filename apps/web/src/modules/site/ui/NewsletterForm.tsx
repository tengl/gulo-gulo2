"use client";

import Link from "next/link";
import { useState } from "react";
import { useHydrated } from "@/shared/useHydrated";

type State =
  | { kind: "idle" | "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

// WEBB-013: an address with explicit consent; the subscription starts only
// when the confirmation mail is answered.
export function NewsletterForm() {
  const hydrated = useHydrated();
  const [state, setState] = useState<State>({ kind: "idle" });
  if (state.kind === "sent")
    return (
      <p className="newsletter-done" role="status">
        Tack! Bekräfta anmälan via länken i mejlet vi just skickade. Hittar du
        det inte, titta i skräpposten.
      </p>
    );
  return (
    <form
      className="newsletter"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setState({ kind: "sending" });
        try {
          const response = await fetch("/api/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: form.get("email"),
              consent: form.get("consent") === "on",
              website: form.get("website"),
            }),
          });
          const data = await response.json().catch(() => null);
          if (response.ok) setState({ kind: "sent" });
          else
            setState({
              kind: "error",
              message:
                typeof data?.error === "string"
                  ? data.error
                  : "Anmälan gick inte att skicka just nu. Försök igen senare.",
            });
        } catch {
          setState({
            kind: "error",
            message: "Anmälan gick inte att skicka just nu. Försök igen senare.",
          });
        }
      }}
    >
      <label htmlFor="newsletter-email">E-postadress</label>
      <div className="newsletter-row">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          disabled={!hydrated}
        />
        <button type="submit" disabled={!hydrated || state.kind === "sending"}>
          {state.kind === "sending" ? "Skickar…" : "Anmäl"}
        </button>
      </div>
      <label className="newsletter-consent">
        <input type="checkbox" name="consent" required disabled={!hydrated} />
        <span>
          Jag vill få Gulo Gulos nyhetsbrev och har läst hur adressen hanteras
          under <Link href="/integritet">integritet</Link>.
        </span>
      </label>
      {/* Left empty by people; filled in by form-filling bots. */}
      <div className="newsletter-trap" aria-hidden>
        <label>
          Webbplats
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {state.kind === "error" && (
        <p className="inline-error" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
