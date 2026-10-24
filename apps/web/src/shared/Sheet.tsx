"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ReactElement, ReactNode } from "react";
import { Icon } from "./Icon";

const ExitContext = createContext<(() => void) | null>(null);
const OPEN_MS = 420;

// Retain only the presentation after its owner has accepted a close.
// Business callbacks have already run; Sheet makes the retained UI inert.
export function SheetPresence({
  children,
}: {
  children: ReactElement | false | null;
}) {
  const [retained, setRetained] = useState<ReactElement | null>(
    children || null,
  );
  if (children && children !== retained) setRetained(children);
  const closing = !children && retained !== null;
  return (
    retained && (
      <ExitContext value={closing ? () => setRetained(null) : null}>
        {retained}
      </ExitContext>
    )
  );
}

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const finishExit = useContext(ExitContext);
  const closing = finishExit !== null;
  const opened = useRef(0);
  useLayoutEffect(() => {
    if (!finishExit || !ref.current) return;
    let current = true;
    const animations = ref.current.getAnimations();
    // UX-012: closing during the opening continues from about where the dialog
    // is, instead of first jumping to fully visible.
    const elapsed = performance.now() - opened.current;
    if (elapsed < OPEN_MS)
      for (const animation of animations) animation.currentTime = OPEN_MS - elapsed;
    void Promise.allSettled(
      animations.map((animation) => animation.finished),
    ).then(() => {
      if (current) finishExit();
    });
    return () => {
      current = false;
    };
  }, [finishExit]);
  useEffect(() => {
    const dialog = ref.current;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog?.showModal();
    opened.current = performance.now();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      // UX-010: removal of an open dialog can otherwise leave focus on <body>.
      // If the opener was hidden meanwhile (a view change), use the main region.
      requestAnimationFrame(() => {
        if (opener?.isConnected && opener.checkVisibility())
          opener.focus({ preventScroll: true });
        else
          document
            .querySelector<HTMLElement>("main[tabindex]")
            ?.focus({ preventScroll: true });
      });
    };
  }, []);
  return (
    <dialog
      className={`sheet${closing ? " is-closing" : ""}`}
      ref={ref}
      aria-label={title}
      aria-hidden={closing}
      inert={closing}
      onCancel={(event) => {
        // Let the caller keep the dialog open when discarding edits is declined.
        event.preventDefault();
        if (!closing) onClose();
      }}
      onClick={(event) => {
        if (!closing && event.target === event.currentTarget) onClose();
      }}
    >
      <div className="sheet-body">
        <button
          type="button"
          className="icon-button close-sheet"
          aria-label="Stäng"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
        {children}
      </div>
    </dialog>
  );
}
