"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

type View = "menu" | "chat" | "cart" | "orders";
type Direction = "forward" | "back" | "up" | "down";

// UX-013: views sit side by side in navigation order. On narrow screens the
// cart is a full view that rises from below; on wide screens it is the always
// visible side panel next to the menu.
const ORDER: Record<View, number> = { menu: 0, cart: 0, chat: 1, orders: 2 };
const WIDE = "(min-width: 761px)";
const DURATION = 420;

function direction(from: View, to: View): Direction | null {
  const wide = window.matchMedia(WIDE).matches;
  if (!wide && to === "cart") return "up";
  if (!wide && from === "cart") return "down";
  if (ORDER[to] === ORDER[from]) return null;
  return ORDER[to] > ORDER[from] ? "forward" : "back";
}

const ENTER: Record<Direction, Keyframe> = {
  forward: { transform: "translateX(30%)", opacity: 0 },
  back: { transform: "translateX(-30%)", opacity: 0 },
  up: { transform: "translateY(40px)", opacity: 0 },
  down: { transform: "translateY(-16px)", opacity: 0 },
};

function hiddenOrDetached(element: HTMLElement | null) {
  return !element?.isConnected || !element.checkVisibility();
}

// UX-013: animate the visual change without remounting the conversation.
export function useOrderingView() {
  const [view, setView] = useState<View>("chat");
  const root = useRef<HTMLDivElement>(null);
  const requested = useRef<View>("chat");
  const revision = useRef(0);
  const pending = useRef<(() => void) | null>(null);
  const scroll = useRef(new Map<View, number>());
  useEffect(
    () => () => {
      revision.current++;
      pending.current?.();
    },
    [],
  );

  function navigate(next: View) {
    const previous = requested.current;
    if (previous === next) return;
    requested.current = next;
    const version = ++revision.current;
    pending.current?.();
    pending.current = null;
    scroll.current.set(previous, window.scrollY);
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const apply = () => {
      if (revision.current !== version) return;
      flushSync(() => setView(next));
      // Each view keeps its own place; a view seen for the first time starts at the top.
      window.scrollTo({
        top: scroll.current.get(next) ?? 0,
        behavior: "instant",
      });
      if (opener && hiddenOrDetached(opener))
        root.current
          ?.querySelector<HTMLElement>("#main-content")
          ?.focus({ preventScroll: true });
    };
    const element = root.current;
    const motion = element ? direction(previous, next) : null;
    if (
      !element ||
      !motion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      apply();
      return;
    }
    const html = document.documentElement;
    if (typeof document.startViewTransition === "function") {
      html.dataset.navDirection = motion;
      const transition = document.startViewTransition(apply);
      const cancel = () => transition.skipTransition();
      pending.current = cancel;
      void transition.ready.catch(() => {});
      const finish = () => {
        if (pending.current === cancel) pending.current = null;
        if (revision.current === version) delete html.dataset.navDirection;
      };
      void transition.finished.then(finish, finish);
      return;
    }

    // Without View Transitions only the incoming view moves. An interrupted
    // movement continues from where it is instead of jumping back.
    // On phones the cart panel replaces the view content.
    const target = element.querySelector<HTMLElement>(
      motion === "up" ? ".cart-pane" : ".experience-main",
    );
    const running = target
      ?.getAnimations()
      .find((item) => item.id === "view");
    let from = ENTER[motion];
    if (target && running) {
      const style = getComputedStyle(target);
      from = { transform: style.transform, opacity: style.opacity };
      running.cancel();
    }
    apply();
    if (!target) return;
    const animation = target.animate(
      [from, { transform: "none", opacity: 1 }],
      { duration: DURATION, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
    );
    animation.id = "view";
  }
  return { view, setView: navigate, root };
}
