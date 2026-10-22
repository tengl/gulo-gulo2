"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const client = () => true;
const server = () => false;

// Keep server-rendered interactive controls inert until their handlers are ready.
export function useHydrated() {
  return useSyncExternalStore(subscribe, client, server);
}
