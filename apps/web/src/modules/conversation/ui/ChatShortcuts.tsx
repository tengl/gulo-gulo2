"use client";

import { useLayoutEffect, useRef } from "react";

function Shortcut({
  label,
  visible = true,
  busy,
  onClick,
}: {
  label: string;
  visible?: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const element = button.current;
    if (!element) return;
    const measure = () =>
      wrapper.current?.style.setProperty(
        "--shortcut-width",
        `${element.getBoundingClientRect().width}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={wrapper}
      className={`chat-shortcut${visible ? "" : " shortcut-hidden"}`}
      aria-hidden={!visible}
      inert={!visible}
    >
      <button
        ref={button}
        type="button"
        disabled={busy || !visible}
        tabIndex={visible ? 0 : -1}
        onClick={onClick}
      >
        {label}
      </button>
    </div>
  );
}

export function ChatShortcuts({
  started,
  hasCart,
  hasOrders,
  busy,
  onSend,
}: {
  started: boolean;
  hasCart: boolean;
  hasOrders: boolean;
  busy: boolean;
  onSend: (text: string) => void;
}) {
  return (
    <div className="chat-starters" role="group" aria-label="Snabbval i chatten">
      <Shortcut label="Meny" busy={busy} onClick={() => onSend("meny")} />
      <Shortcut
        label="Visa varukorg"
        visible={hasCart}
        busy={busy}
        onClick={() => onSend("Vad har jag i varukorgen?")}
      />
      <Shortcut
        label="Mina beställningar"
        visible={hasOrders}
        busy={busy}
        onClick={() => onSend("Mina beställningar")}
      />
      <Shortcut
        label="Vem gör korven?"
        visible={!started}
        busy={busy}
        onClick={() => onSend("Vem gör korven?")}
      />
      <Shortcut
        label="Berätta om Ghostdog"
        visible={!started}
        busy={busy}
        onClick={() => onSend("Berätta om Ghostdog")}
      />
    </div>
  );
}
