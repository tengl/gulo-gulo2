"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useOrderMemory } from "@/modules/ordering/ui/useOrderMemory";
import {
  getSoundState,
  getServerSoundState,
  subscribeSound,
  enableOrderSound,
  disableOrderSound,
  observeOrderArrivals,
} from "./order-sound";

export function AdminOrderSound() {
  const { memory, ready, error } = useOrderMemory();
  const sound = useSyncExternalStore(
    subscribeSound,
    getSoundState,
    getServerSoundState,
  );
  useEffect(() => {
    void observeOrderArrivals(memory.orders, ready, error);
  }, [memory.orders, ready, error]);
  return (
    <section className="admin-order-sound" aria-label="Orderljud">
      <div>
        <button
          className="admin-secondary"
          disabled={
            sound.busy || (!sound.enabled && (!ready || Boolean(error)))
          }
          onClick={sound.enabled ? disableOrderSound : enableOrderSound}
        >
          {sound.enabled ? "Stäng av orderljud" : "Aktivera orderljud"}
        </button>
        {sound.enabled && (
          <button
            className="admin-sound-test"
            disabled={sound.busy}
            onClick={enableOrderSound}
          >
            Prova ljud
          </button>
        )}
      </div>
      <p role="status">
        {error
          ? "Orderljud kan inte bevaka beställningar eftersom det lokala minnet inte kan läsas."
          : sound.message}
      </p>
    </section>
  );
}
