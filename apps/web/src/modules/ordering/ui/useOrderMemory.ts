"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_MEMORY, parseMemory } from "../index";
import type { OrderMemory } from "../index";

const STORAGE_KEY = "gulo-order-memory-v1";
type Snapshot = { memory: OrderMemory; error: string; ready: boolean };
const initial: Snapshot = { memory: EMPTY_MEMORY, error: "", ready: false };
let snapshot = initial;
let lastRaw: string | null | undefined;
const listeners = new Set<() => void>();

function getSnapshot(): Snapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== lastRaw || !snapshot.ready || snapshot.error) {
      const memory = parseMemory(raw);
      lastRaw = raw;
      snapshot = { memory, ready: true, error: "" };
    }
  } catch {
    if (!snapshot.error)
      snapshot = {
        memory: snapshot.memory,
        ready: true,
        error:
          "Det lokala minnet kunde inte läsas. Dina val finns kvar i den här vyn. Rensa minnet för att försöka igen, eller tillåt webbplatslagring i webbläsaren.",
      };
  }
  return snapshot;
}

function notify() {
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const sync = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      lastRaw = undefined;
      notify();
    }
  };
  window.addEventListener("storage", sync);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", sync);
  };
}

// CHATT-005/006: persist before acknowledging saves. Drafts may remain in memory.
function updateMemory(
  change: (memory: OrderMemory) => OrderMemory,
  mustPersist = false,
) {
  const current = getSnapshot();
  if (mustPersist && current.error)
    throw new Error(
      "Beställningen kunde inte sparas. Rensa eller tillåt det lokala minnet och försök igen.",
    );
  const next = change(current.memory);
  const raw = JSON.stringify({ version: 1, ...next });
  // A successful write must be readable after a reload, including format/size limits.
  parseMemory(raw);
  try {
    if (current.error) throw new Error("Storage unavailable");
    localStorage.setItem(STORAGE_KEY, raw);
    lastRaw = raw;
    snapshot = { memory: next, error: "", ready: true };
  } catch {
    if (mustPersist)
      throw new Error(
        "Beställningen kunde inte sparas. Tillåt webbplatslagring eller frigör utrymme och försök igen. Inget har ändrats.",
      );
    snapshot = {
      memory: next,
      ready: true,
      error:
        "Dina val finns bara kvar i den här vyn eftersom webbläsaren inte kunde spara dem. Sparade beställningar kräver fungerande lokalt minne.",
    };
  }
  notify();
}

function forgetMemory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    lastRaw = null;
    snapshot = { memory: EMPTY_MEMORY, error: "", ready: true };
    notify();
  } catch {
    throw new Error(
      "Kunde inte rensa minnet. Kontrollera webbläsarens inställningar för webbplatslagring.",
    );
  }
}

export function useOrderMemory() {
  return {
    ...useSyncExternalStore(subscribe, getSnapshot, () => initial),
    updateMemory,
    forgetMemory,
  };
}
