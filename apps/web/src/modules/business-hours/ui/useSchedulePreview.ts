"use client";

import { useMemo, useSyncExternalStore } from "react";
import { initialSchedule, readSchedule, type Schedule } from "../index";

const key = "gulo-hours-preview-v1";
const changed = "gulo-hours-preview-changed";
const blocked = "!storage-unavailable";
function snapshot(): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return blocked;
  }
}
function subscribe(notify: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) notify();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(changed, notify);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changed, notify);
  };
}

export function useSchedulePreview() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const { schedule, error } = useMemo(() => {
    try {
      if (raw === blocked)
        throw new Error(
          "Lokal lagring är blockerad. Inga ändringar kan sparas.",
        );
      let stored: unknown;
      if (raw !== null) {
        try {
          stored = JSON.parse(raw);
        } catch {
          throw new Error(
            "Det sparade schemat är skadat och kunde inte läsas.",
          );
        }
      }
      return {
        schedule: raw === null ? initialSchedule() : readSchedule(stored),
        error: "",
      };
    } catch (cause) {
      return {
        schedule: initialSchedule(),
        error:
          cause instanceof Error
            ? cause.message
            : "Det sparade schemat kunde inte läsas.",
      };
    }
  }, [raw]);

  async function save(candidate: Schedule, reset = false) {
    // BEH-005: check session again before saving; expired sessions return to login.
    const response = await fetch("/api/admin/session", { cache: "no-store" });
    if (response.status === 401) {
      window.location.reload();
      throw new Error("Sessionen har gått ut. Logga in igen.");
    }
    if (!response.ok)
      throw new Error("Kunde inte kontrollera inloggningen. Försök igen.");
    const validated = readSchedule(candidate);
    if (snapshot() !== raw)
      throw new Error(
        "Schemat har ändrats i en annan flik. Stäng redigeringen och öppna igen.",
      );
    if (error && !reset)
      throw new Error(
        "Återställ den lokala förhandsvisningen innan du sparar nya ändringar.",
      );
    try {
      if (reset) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(validated));
    } catch {
      throw new Error(
        "Kunde inte spara på den här enheten. Kontrollera webbläsarens lagring.",
      );
    }
    window.dispatchEvent(new Event(changed));
  }
  return { schedule, error, save };
}
