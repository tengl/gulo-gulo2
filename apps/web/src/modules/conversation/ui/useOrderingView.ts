"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

type View = "menu" | "chat" | "cart" | "orders";

// UX-013: animate the visual change without remounting the conversation.
export function useOrderingView() {
  const [view, setView] = useState<View>("chat");
  const root = useRef<HTMLDivElement>(null);
  const requested = useRef<View>("chat");
  const revision = useRef(0);
  const pending = useRef<(() => void) | null>(null);
  useEffect(
    () => () => {
      revision.current++;
      pending.current?.();
    },
    [],
  );

  function navigate(next: View) {
    if (requested.current === next) return;
    requested.current = next;
    const version = ++revision.current;
    pending.current?.();
    pending.current = null;
    const apply = () => {
      if (revision.current === version) flushSync(() => setView(next));
    };
    const element = root.current;
    if (
      !element ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      apply();
      return;
    }
    if (typeof document.startViewTransition === "function") {
      const transition = document.startViewTransition(apply);
      const cancel = () => transition.skipTransition();
      pending.current = cancel;
      void transition.ready.catch(() => {});
      const finish = () => {
        if (pending.current === cancel) pending.current = null;
      };
      void transition.finished.then(finish, finish);
      return;
    }

    // Older browsers still get both an exit and entrance, using Web Animations.
    let animation: Animation | undefined;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const cancel = () => {
      animation?.cancel();
      element.inert = false;
    };
    pending.current = cancel;
    element.inert = true;
    void (async () => {
      try {
        animation = element.animate(
          [
            { opacity: 1 },
            { opacity: 0 },
          ],
          { duration: 200, easing: "ease-in", fill: "forwards" },
        );
        await animation.finished;
        if (revision.current !== version) return;
        apply();
        animation.cancel();
        animation = element.animate(
          [
            { opacity: 0 },
            { opacity: 1 },
          ],
          { duration: 320, easing: "ease-out" },
        );
        await animation.finished;
      } catch {
        /* Cancellation hands control to the newest navigation. */
      } finally {
        if (pending.current === cancel) {
          element.inert = false;
          pending.current = null;
          if (opener?.isConnected) opener.focus({ preventScroll: true });
        }
      }
    })();
  }
  return { view, setView: navigate, root };
}
