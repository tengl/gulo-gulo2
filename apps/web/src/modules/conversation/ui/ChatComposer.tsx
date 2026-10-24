"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@/shared/Icon";
import { useHydrated } from "@/shared/useHydrated";

export function ChatComposer({
  text,
  onText,
  busy,
  onSubmit,
  onStop,
}: {
  text: string;
  onText: (value: string) => void;
  busy: boolean;
  onSubmit: () => void;
  onStop: () => void;
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  const hydrated = useHydrated();
  const [focused, setFocused] = useState(false);
  useLayoutEffect(() => {
    const element = input.current;
    if (!element) return;
    function resize() {
      if (!element) return;
      element.style.height = "auto";
      if (!focused) return;
      const style = getComputedStyle(element);
      const line = parseFloat(style.lineHeight);
      const padding =
        parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const minimum = line * 2 + padding;
      const maximum = Math.max(
        minimum,
        Math.min(line * 8 + padding, window.innerHeight * 0.35),
      );
      element.style.height = `${Math.min(maximum, Math.max(minimum, element.scrollHeight))}px`;
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [text, focused]);
  return (
    <form
      className="chat-composer"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor="chat-message" className="sr-only">
        Meddelande till Gulo Gulo
      </label>
      <textarea
        id="chat-message"
        disabled={!hydrated}
        ref={input}
        value={text}
        maxLength={600}
        rows={focused ? 2 : 1}
        placeholder="Fråga eller beställ…"
        onChange={(event) => onText(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
      {busy ? (
        <button
          type="button"
          className="chat-send"
          aria-label="Avbryt svar"
          onClick={onStop}
        >
          <span className="stop-icon" />
        </button>
      ) : (
        <button
          type="submit"
          className="chat-send"
          aria-label="Skicka meddelande"
          disabled={!hydrated || !text.trim()}
        >
          <Icon name="arrow" />
        </button>
      )}
    </form>
  );
}
