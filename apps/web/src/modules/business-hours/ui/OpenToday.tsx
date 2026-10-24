"use client";

import { useEffect, useState } from "react";
import { demoHours, openingStatus } from "../index";
import type { OpeningStatus } from "../index";
import { Icon } from "@/shared/Icon";

function describe(status: OpeningStatus): string {
  if (status.kind === "open") return `Öppet nu, till ${status.until}`;
  if (status.kind === "later") return `Öppnar i dag ${status.from}`;
  if (status.kind === "closed-for-the-day") return "Stängt för i dag";
  return "Stängt i dag";
}

// WEBB-009: the ordinary hours are server-rendered; today's status is added in
// the browser, where the current time is known.
export function OpenToday() {
  const [status, setStatus] = useState<OpeningStatus | null>(null);
  useEffect(() => {
    const update = () => setStatus(openingStatus(new Date()));
    const first = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 60_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);
  return (
    <section className="open-today" aria-label="Öppettider">
      <Icon name="clock" size={20} />
      <div>
        <strong aria-live="polite">
          {status ? describe(status) : "Öppettider"}
        </strong>
        <span>
          {demoHours.days} {demoHours.opening.from}–{demoHours.opening.until}
          {" · "}köket stänger 30 min före
        </span>
      </div>
      <span
        className={`open-dot${status?.kind === "open" ? " is-open" : ""}`}
        aria-hidden
      />
    </section>
  );
}
