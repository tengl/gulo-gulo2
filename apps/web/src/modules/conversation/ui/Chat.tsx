"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  cartFingerprint,
  describeSavedOrder,
  hasActiveCustomerOrders,
} from "@/modules/ordering";
import type { Cart, SavedOrder } from "@/modules/ordering";
import type { ChatAction, ChatMessage, ChatReply } from "../index";
import { Icon } from "@/shared/Icon";
import { ChatProposal } from "./ChatProposal";
import { ChatAvatar } from "./ChatAvatar";
import { ChatComposer } from "./ChatComposer";
import { ChatShortcuts } from "./ChatShortcuts";
import { scrollChat } from "./scroll-chat";
import { OrderingHours } from "@/modules/business-hours/ui/OrderingHours";

type Message = ChatMessage & { id: string; action?: ChatAction; base?: string };
const welcome: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Välkommen till Gulo Gulo! Här kan du beställa, fråga om våra wraps eller prata om hur korven görs. Du kan välja i menyn när du vill — jag har koll på samma varukorg.\n\nVad är du sugen på?",
};

function syncIntroduction(
  container: HTMLDivElement,
  intro: HTMLDivElement | null,
) {
  if (!intro?.offsetHeight) return;
  intro.style.setProperty(
    "--intro-progress",
    String(Math.min(1, Math.max(0, container.scrollTop / intro.offsetHeight))),
  );
}

export function Chat({
  active,
  cart,
  orders,
  onApply,
  onNavigate,
  introduction,
}: {
  active: boolean;
  cart: Cart;
  orders: readonly SavedOrder[];
  onApply: (action: ChatAction, base: string) => string | undefined;
  onNavigate: (action: ChatAction) => void;
  introduction: ReactNode;
}) {
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"claude" | "limited" | "loading">("loading");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<Message[] | null>(null);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const previousActive = useRef(active);
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/chat", { signal: abort.signal, cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        setMode(data.mode === "claude" ? "claude" : "limited");
      })
      .catch(() => {
        if (!abort.signal.aborted) setMode("limited");
      });
    return () => {
      abort.abort();
      controller.current?.abort();
    };
  }, []);
  useLayoutEffect(() => {
    const returning = active && !previousActive.current;
    previousActive.current = active;
    const container = log.current;
    if (!active || !container) return;
    if (!returning && messages.length === 1 && !busy && !error) return;
    const last = messages.at(-1);
    const menu =
      !returning && !busy && !error && last?.action?.kind === "menu"
        ? container.querySelector<HTMLElement>(`[data-message-id="${last.id}"]`)
        : null;
    const top = menu
      ? menu.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop -
        12
      : container.scrollHeight;
    if (
      returning ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      container.scrollTo({ top, behavior: "instant" });
      syncIntroduction(container, intro.current);
      return;
    }
    return scrollChat(container, top);
  }, [active, messages, busy, error]);
  async function send(history: Message[]) {
    if (controller.current) return;
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setError("");
    setFailed(null);
    const base = cartFingerprint(cart);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abort.signal,
        body: JSON.stringify({
          messages: history.slice(-20).map(({ role, content }) => ({
            role,
            content: content.slice(0, 4000),
          })),
          cart,
          orders: orders.map((order) => ({
            reference: order.reference,
            status: order.status,
            preparation: order.preparation,
            summary: describeSavedOrder(order).slice(0, 8000),
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Kunde inte hämta svar.",
        );
      if (
        typeof data.text !== "string" ||
        (data.mode !== "claude" && data.mode !== "limited")
      )
        throw new Error("Svaret kunde inte läsas. Försök igen.");
      const reply = data as ChatReply;
      setMode(reply.mode);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply.text,
          action: reply.action,
          base,
        },
      ]);
    } catch (cause) {
      setFailed(history);
      setError(
        abort.signal.aborted
          ? "Svaret avbröts. Dina val är kvar."
          : cause instanceof Error
            ? cause.message
            : "Kunde inte nå chatten. Dina val är kvar.",
      );
    } finally {
      controller.current = null;
      setBusy(false);
    }
  }
  function sendText(value: string, clearDraft = false) {
    if (!value.trim() || busy || controller.current) return;
    const next = [
      ...messages,
      { id: crypto.randomUUID(), role: "user" as const, content: value.trim() },
    ];
    setMessages(next);
    if (clearDraft) setText("");
    void send(next);
  }
  function submit() {
    sendText(text, true);
  }
  return (
    <section
      className={`chat-panel${messages.length > 1 ? " conversation-started" : ""}`}
      aria-labelledby="chat-title"
    >
      <OrderingHours />
      <div
        className="chat-log"
        ref={log}
        onScroll={(event) =>
          syncIntroduction(event.currentTarget, intro.current)
        }
      >
        <div className="chat-intro" ref={intro}>
          {introduction}
          <header className="chat-header">
            <div>
              <span className="eyebrow">Gulo Gulo · vid din sida</span>
              <h1 id="chat-title">Vad är du sugen på?</h1>
            </div>
            <span className="chat-mode">
              <span className="tiny-dot" />
              {mode === "claude"
                ? "Claude"
                : mode === "limited"
                  ? "Begränsad demo"
                  : "Ansluter…"}
            </span>
          </header>
        </div>
        <div
          className="chat-messages"
          role="log"
          aria-label="Samtal med Gulo Gulo"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.map((message) => (
            <article
              key={message.id}
              data-message-id={message.id}
              className={`chat-message from-${message.role}`}
              aria-label={message.role === "user" ? "Du" : "Gulo Gulo"}
            >
              {message.role === "assistant" && <ChatAvatar />}
              <div className="message-body">
                <p className="chat-prose">{message.content}</p>
                {message.action && (
                  <ChatProposal
                    action={message.action}
                    cart={cart}
                    orders={orders}
                    stale={message.base !== cartFingerprint(cart)}
                    onApply={(action) => {
                      const result = onApply(action, message.base ?? "");
                      if (!result)
                        setMessages((current) => [
                          ...current,
                          {
                            id: crypto.randomUUID(),
                            role: "assistant",
                            content:
                              "Varukorgen är uppdaterad. Du kan fråga vad du har i varukorgen eller fortsätta välja från menyn.",
                          },
                        ]);
                      return result;
                    }}
                    onNavigate={onNavigate}
                    onSend={sendText}
                    busy={busy}
                  />
                )}
              </div>
            </article>
          ))}
          {busy && (
            <div className="chat-thinking" role="status">
              <ChatAvatar />
              <span>
                Gulo Gulo skriver<span className="thinking-dots">…</span>
              </span>
            </div>
          )}
          {error && (
            <div className="chat-error" role="alert">
              <p>{error}</p>
              {failed && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => void send(failed)}
                >
                  Försök igen <Icon name="arrow" size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <ChatShortcuts
        started={messages.length > 1}
        hasCart={cart.length > 0}
        hasOrders={hasActiveCustomerOrders(orders)}
        busy={busy}
        onSend={sendText}
      />
      <ChatComposer
        text={text}
        onText={setText}
        busy={busy}
        onSubmit={submit}
        onStop={() => controller.current?.abort()}
      />
      <p className="chat-disclaimer">
        {mode === "claude"
          ? "AI kan missförstå. Kontrollera dina val före godkännande."
          : "Enkla val och faktasvar fungerar. Fri dialog kräver ansluten Claude."}{" "}
        Ingen riktig order skickas.
      </p>
    </section>
  );
}
