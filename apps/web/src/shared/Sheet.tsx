"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

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
  useEffect(() => {
    const dialog = ref.current;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      // UX-010: removal of an open dialog can otherwise leave focus on <body>.
      requestAnimationFrame(() => {
        if (opener?.isConnected) opener.focus({ preventScroll: true });
      });
    };
  }, []);
  return (
    <dialog
      className="sheet"
      ref={ref}
      aria-label={title}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
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
