"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useHydrated } from "@/shared/useHydrated";

export function AdminLogin({ configured }: { configured: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = useHydrated();
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = new FormData(event.currentTarget).get("code");
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Inloggningen misslyckades.");
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kunde inte ansluta.");
      setBusy(false);
    }
  }
  return (
    <main className="admin-login admin-scope" inert={!ready}>
      <div className="admin-login-card">
        <Image
          src="/logo-light.png"
          alt="Gulo Gulo"
          width={80}
          height={80}
          priority
        />
        <span className="eyebrow">Gulo Gulo · internt</span>
        <h1>Välkommen in.</h1>
        <p>Logga in för att planera veckan och justera tider.</p>
        {configured ? (
          <form onSubmit={login}>
            <label htmlFor="admin-code">Superadmin-kod</label>
            <input
              id="admin-code"
              name="code"
              type="password"
              autoComplete="current-password"
              required
              maxLength={512}
              aria-describedby={error ? "login-error" : undefined}
            />
            {error && (
              <p id="login-error" role="alert" className="admin-error">
                {error}
              </p>
            )}
            <button className="admin-primary" disabled={busy}>
              {busy ? "Loggar in…" : "Logga in"}
            </button>
          </form>
        ) : (
          <div className="admin-notice">
            <strong>Administration är låst</strong>
            <p>
              Sätt ADMIN_ACCESS_CODE till en separat slumpmässig kod med minst
              16 tecken i servermiljön. Starta sedan om servern.
            </p>
          </div>
        )}
        <Link href="/">Till beställningen ↗</Link>
      </div>
    </main>
  );
}
