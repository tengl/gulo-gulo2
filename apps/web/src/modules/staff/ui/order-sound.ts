"use client";

import { detectOrderArrivals } from "../index";
import type { SavedOrder } from "@/modules/ordering";

type SoundState = { enabled: boolean; busy: boolean; message: string };
const initial: SoundState = {
  enabled: false,
  busy: false,
  message: "Orderljud är av. Aktivera för att höra nya beställningar.",
};
let state = initial;
let context: AudioContext | null = null;
let known: string[] | null = null;
let generation = 0;
const listeners = new Set<() => void>();
function publish(next: SoundState) {
  state = next;
  listeners.forEach((listener) => listener());
}
export const getSoundState = () => state;
export const getServerSoundState = () => initial;
export function subscribeSound(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function chime(audio: AudioContext) {
  if (audio.state !== "running")
    throw new Error(
      "Ljudet har pausats av webbläsaren. Aktivera orderljud igen.",
    );
  // Two short, softly enveloped tones; no downloaded media or external service.
  for (const [index, frequency] of [660, 880].entries()) {
    const at = audio.currentTime + index * 0.18;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.12, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.28);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start(at);
    oscillator.stop(at + 0.3);
  }
}

export async function enableOrderSound() {
  const current = ++generation;
  publish({ ...state, busy: true, message: "Aktiverar orderljud…" });
  try {
    if (!context || context.state === "closed") {
      context = new AudioContext();
      const audio = context;
      audio.onstatechange = () => {
        if (audio === context && state.enabled && audio.state !== "running")
          publish({
            enabled: false,
            busy: false,
            message:
              "Orderljudet har pausats. Aktivera det igen för att höra nya beställningar.",
          });
      };
    }
    // Resume directly inside the click gesture, before any network await.
    await context.resume();
    if (current !== generation) return;
    chime(context);
    publish({
      enabled: true,
      busy: false,
      message: "Orderljud är på. En testsignal spelades.",
    });
  } catch {
    if (current === generation)
      publish({
        enabled: false,
        busy: false,
        message:
          "Kunde inte aktivera ljudet. Tillåt ljud i webbläsaren och försök igen.",
      });
  }
}

export function disableOrderSound() {
  ++generation;
  publish({ enabled: false, busy: false, message: initial.message });
  void context?.suspend().catch(() => {});
}

export async function observeOrderArrivals(
  orders: readonly SavedOrder[],
  ready: boolean,
  error: string,
) {
  if (!ready) return;
  if (error) {
    known = null;
    return;
  }
  const next = detectOrderArrivals(known, orders);
  known = next.known;
  if (!next.arrivals.length || !state.enabled || !context) return;
  const current = generation;
  try {
    const response = await fetch("/api/admin/session", { cache: "no-store" });
    if (current !== generation || !state.enabled) return;
    if (!response.ok)
      throw new Error(
        "Sessionen kunde inte verifieras. Logga in igen och aktivera orderljud.",
      );
    chime(context);
    publish({
      ...state,
      message: `${next.arrivals.length === 1 ? "Ny demobeställning" : `${next.arrivals.length} nya demobeställningar`}. Ljudsignal spelad.`,
    });
  } catch (cause) {
    if (current === generation)
      publish({
        enabled: false,
        busy: false,
        message:
          cause instanceof Error
            ? cause.message
            : "Orderljudet kunde inte spelas. Aktivera det igen.",
      });
  }
}
