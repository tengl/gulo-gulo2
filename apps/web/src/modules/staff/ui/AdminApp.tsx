"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/shared/Icon";
import { HoursAdmin } from "@/modules/business-hours/ui/HoursAdmin";
import { useHydrated } from "@/shared/useHydrated";

export function AdminApp({ today }: { today: string }) {
  const [view, setView] = useState<"hours" | "connections">("hours");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = useHydrated();
  async function logout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/session", { method: "DELETE" });
      if (!response.ok) throw new Error();
      window.location.reload();
    } catch {
      setError("Kunde inte logga ut. Försök igen.");
      setBusy(false);
    }
  }
  return (
    <div className="admin-shell admin-scope" inert={!ready}>
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          <Image src="/logo-light.png" alt="Gulo Gulo" width={58} height={58} />
          <span>
            GULO GULO<small>Administration</small>
          </span>
        </Link>
        <span className="admin-nav-caption">Din verksamhet</span>
        <nav aria-label="Administration">
          <button
            aria-current={view === "hours" ? "page" : undefined}
            onClick={() => setView("hours")}
          >
            <Icon name="clock" />
            Öppettider
          </button>
          <button
            aria-current={view === "connections" ? "page" : undefined}
            onClick={() => setView("connections")}
          >
            <Icon name="menu" />
            Anslutningar
          </button>
        </nav>
        <div className="admin-sidebar-bottom">
          <span className="admin-role">● Superadmin</span>
          <Link href="/">Öppna beställningen ↗</Link>
        </div>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar">
          <span>
            Gulo Gulo{" "}
            <span>/ {view === "hours" ? "Öppettider" : "Anslutningar"}</span>
          </span>
          <Link className="admin-mobile-customer-link" href="/">
            Beställningen ↗
          </Link>
          <button onClick={logout} disabled={busy}>
            {busy ? "Loggar ut…" : "Logga ut"}
          </button>
        </header>
        {error && (
          <p role="alert" className="admin-error">
            {error}
          </p>
        )}
        <main>
          {view === "hours" ? (
            <HoursAdmin today={today} />
          ) : (
            <>
              <div className="admin-page-title">
                <div>
                  <span className="eyebrow">Nästa steg mot drift</span>
                  <h1>Anslutningar</h1>
                  <p>Här ser du vad administrationen är ansluten till.</p>
                </div>
              </div>
              <div className="admin-connection-grid">
                <section className="admin-connection">
                  <span className="admin-pill">Ej anslutet</span>
                  <h2>Google</h2>
                  <p>
                    Öppettider ska kunna publiceras till Google Business
                    Profile. Kontokoppling och publicering återstår.
                  </p>
                  <p>
                    Endast öppettider publiceras. Beställningsfönstret är en
                    egen inställning i appen.
                  </p>
                </section>
                <section className="admin-connection">
                  <span className="admin-pill">Lokal förhandsvisning</span>
                  <h2>Gemensam lagring</h2>
                  <p>
                    Administrationens tider sparas på den här enheten.
                    Supabase-lagring och kopplingen till kundens tider återstår.
                  </p>
                  <p>
                    Ändringar delas ännu inte med andra enheter eller med
                    kunderna.
                  </p>
                </section>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
