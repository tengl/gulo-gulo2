import {
  demoMenu,
  businessFacts,
  productFacts,
  formatPrice,
  DOUBLE_SURCHARGE_ORE,
} from "../../catalog/index.ts";
import {
  describeCart,
  readSelections,
  readCart,
  addSelections,
  cartFingerprint,
  isDemoOrderStatus,
  canCancelDemoOrder,
  isDemoOrderPreparation,
} from "../../ordering/index.ts";
import { ordinaryHoursText } from "../../business-hours/index.ts";
import type { Cart, Selection, SavedOrder } from "../../ordering/index.ts";
import { normalizeText, parseDemoRequest } from "./demo-request.ts";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatAction =
  | { kind: "add" | "replace"; items: Selection[] }
  | { kind: "remove"; keys: string[] }
  | { kind: "review" | "orders" | "menu" }
  | { kind: "cancel"; reference: string };
export type ChatReply = {
  text: string;
  action?: ChatAction;
  mode: "claude" | "limited";
};
export type ChatContext = {
  messages: ChatMessage[];
  cart: Cart;
  orders: {
    reference: string;
    status: SavedOrder["status"];
    preparation?: SavedOrder["preparation"];
    summary: string;
  }[];
};

export function applyCartProposal(
  cart: Cart,
  action: ChatAction,
  base: string,
): Cart {
  if (cartFingerprint(cart) !== base)
    throw new Error("Varukorgen har ändrats. Be om ett nytt förslag.");
  if (action.kind === "add")
    return addSelections(cart, readSelections(action.items));
  if (action.kind === "replace")
    return addSelections([], readSelections(action.items));
  if (
    action.kind === "remove" &&
    action.keys.length > 0 &&
    action.keys.every((key) => cart.some((line) => line.key === key))
  )
    return cart.filter((line) => !action.keys.includes(line.key));
  throw new Error("Det förslaget går inte att använda här.");
}

export function interpretModelReply(
  data: unknown,
  context: ChatContext,
): ChatReply {
  if (!data || typeof data !== "object")
    throw new Error("Ogiltigt modellsvar.");
  const result = data as Record<string, unknown>;
  if (!Array.isArray(result.content) || result.stop_reason === "max_tokens")
    throw new Error("Modellsvaret blev ofullständigt.");
  const blocks = result.content.map((value: unknown) => {
    if (!value || typeof value !== "object")
      throw new Error("Ogiltigt modellsvar.");
    return value as Record<string, unknown>;
  });
  const calls = blocks.filter((block) => block.type === "tool_use");
  if (calls.length > 1)
    throw new Error("Flera samtidiga ändringsförslag stöds inte.");
  // CHATT-004: model prose cannot report success alongside a proposal.
  if (calls.length) {
    if (typeof calls[0]!.name !== "string" || result.stop_reason !== "tool_use")
      throw new Error("Ofullständigt verktygsförslag.");
    return toolReply(calls[0]!.name, calls[0]!.input, context);
  }
  if (result.stop_reason !== "end_turn")
    throw new Error("Modellsvaret är inte färdigt.");
  const text = blocks
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n")
    .trim();
  if (!text || text.length > 8000)
    throw new Error("Assistenten gav inget fullständigt svar.");
  return { mode: "claude", text };
}

export function readChatContext(input: unknown): ChatContext {
  if (!input || typeof input !== "object") throw new Error("Ogiltigt samtal.");
  const data = input as Record<string, unknown>;
  if (
    !Array.isArray(data.messages) ||
    !data.messages.length ||
    data.messages.length > 30 ||
    !Array.isArray(data.orders) ||
    data.orders.length > 30
  )
    throw new Error("Samtalet är för långt eller ogiltigt.");
  const messages: ChatMessage[] = data.messages.map((value: unknown) => {
    const message = value as Record<string, unknown> | null;
    if (
      !message ||
      (message.role !== "user" && message.role !== "assistant") ||
      typeof message.content !== "string" ||
      !message.content.trim() ||
      message.content.length > 4000
    )
      throw new Error("Ogiltigt meddelande.");
    return { role: message.role, content: message.content };
  });
  if (messages.at(-1)?.role !== "user" || messages.at(-1)!.content.length > 600)
    throw new Error("Skriv högst 600 tecken per meddelande.");
  const orders: ChatContext["orders"] = data.orders.map((value: unknown) => {
    const order = value as Record<string, unknown> | null;
    if (
      !order ||
      typeof order.reference !== "string" ||
      !/^DEMO-[0-9A-F-]{36}$/.test(order.reference) ||
      !isDemoOrderStatus(order.status) ||
      (order.preparation !== undefined &&
        !isDemoOrderPreparation(order.preparation)) ||
      typeof order.summary !== "string" ||
      order.summary.length > 8000
    )
      throw new Error("Ogiltig demohistorik.");
    return {
      reference: order.reference,
      status: order.status,
      ...(order.preparation === undefined
        ? {}
        : { preparation: order.preparation as SavedOrder["preparation"] }),
      summary: order.summary,
    };
  });
  return { messages, cart: readCart(data.cart), orders };
}

// CHATT-004/009: proposals only. Tools have no permission to perform a mutation.
export function actionFromTool(
  name: string,
  input: unknown,
  context: ChatContext,
): ChatAction {
  if (!input || typeof input !== "object")
    throw new Error("Ogiltigt verktygsförslag.");
  const value = input as Record<string, unknown>;
  if (
    name === "propose_items" &&
    (value.mode === "add" || value.mode === "replace")
  ) {
    const items = readSelections(value.items, false);
    if (!items.length) throw new Error("Välj minst en produkt.");
    return { kind: value.mode, items };
  }
  if (
    name === "propose_remove" &&
    Array.isArray(value.keys) &&
    value.keys.length > 0 &&
    value.keys.length <= 50 &&
    value.keys.every(
      (key) =>
        typeof key === "string" &&
        context.cart.some((line) => line.key === key),
    )
  )
    return { kind: "remove", keys: [...new Set(value.keys)] };
  if (
    name === "propose_cancel" &&
    typeof value.reference === "string" &&
    context.orders.some(
      (order) =>
        order.reference === value.reference && canCancelDemoOrder(order),
    )
  )
    return { kind: "cancel", reference: value.reference };
  const views = {
    review_order: "review",
    show_orders: "orders",
    show_menu: "menu",
  } as const;
  if (Object.hasOwn(views, name))
    return { kind: views[name as keyof typeof views] };
  throw new Error("Förslaget kunde inte verifieras. Inget har ändrats.");
}

export function toolReply(
  name: string,
  input: unknown,
  context: ChatContext,
): ChatReply {
  if (name === "show_cart")
    return { mode: "claude", text: describeCart(context.cart) };
  const action = actionFromTool(name, input, context);
  const text =
    action.kind === "add" || action.kind === "replace"
      ? "Kontrollera mina föreslagna val. Välj enkel eller dubbel där det saknas, och godkänn för att uppdatera varukorgen."
      : action.kind === "remove"
        ? "Vill du ta bort de här raderna från varukorgen?"
        : action.kind === "cancel"
          ? "Kontrollera demobeställningen och bekräfta om du vill avboka den."
          : action.kind === "review"
            ? "Här kan du granska alla dina val. Ingen riktig beställning skickas i demon."
            : action.kind === "orders"
              ? "Här är dina lokalt sparade demobeställningar."
              : "Våra wraps och drycker. Klicka på en produkt för att välja den, eller fråga om innehållet.";
  return { mode: "claude", text, action };
}

// CHATT-008: limited fallback, not a replacement for free conversation with Claude.
export function limitedReply(context: ChatContext): ChatReply {
  const raw = context.messages.at(-1)!.content;
  const text = normalizeText(raw).replace(/[.!?]+$/, "");
  const reply = (value: Omit<ChatReply, "mode">): ChatReply => ({
    ...value,
    mode: "limited",
  });
  if (
    [
      "vad finns i min varukorg",
      "vad har jag i varukorgen",
      "visa varukorgen",
      "vad har jag bestallt",
      "min bestallning",
      "visa min bestallning",
      "varukorg",
    ].includes(text)
  )
    return reply({ text: describeCart(context.cart) });
  if (
    [
      "mina bestallningar",
      "visa mina bestallningar",
      "avboka",
      "avboka min bestallning",
    ].includes(text)
  )
    return reply({
      text: "Välj den demobeställning du vill se eller avboka i Mina beställningar.",
      action: { kind: "orders" },
    });
  const reference = /^avboka\s+(DEMO-[0-9A-F-]{36})$/i.exec(raw.trim());
  if (reference) {
    const order = context.orders.find(
      (item) => item.reference === reference[1]!.toUpperCase(),
    );
    if (order && (order.status === "paid" || order.status === "collected"))
      return reply({
        text: "Demobeställningen är markerad som betald eller hämtad. Efter betalning kontaktar du personalen för avbokning. Ingen riktig betalning har gjorts i demon.",
        action: { kind: "orders" },
      });
    try {
      return {
        ...toolReply(
          "propose_cancel",
          { reference: reference[1]!.toUpperCase() },
          context,
        ),
        mode: "limited",
      };
    } catch {
      return reply({
        text: "Jag hittar ingen aktiv demobeställning med den referensen i ditt lokala minne. Öppna Mina beställningar för att välja rätt.",
        action: { kind: "orders" },
      });
    }
  }
  if (["granska", "jag ar klar", "bestall", "ga till kassan"].includes(text))
    return reply({
      text: "Granska dina val innan du sparar en lokal demobeställning.",
      action: { kind: "review" },
    });
  if (
    [
      "hur tillverkas korven",
      "vem gor korven",
      "var tillverkas korven",
      "beratta om tillverkningen",
      "vad ar gulo gulo",
    ].includes(text)
  )
    return reply({ text: businessFacts.craft });
  if (["allergener", "vilka allergener finns", "innehall"].includes(text))
    return reply({ text: businessFacts.allergens });
  if (["vad ingar", "vilka tillbehor ingar"].includes(text))
    return reply({ text: businessFacts.accompaniments });
  const info = /^(?:beratta om|vad innehaller|hur tillverkas) (.+)$/.exec(text);
  if (info) {
    const product = demoMenu.find((item) => item.aliases.includes(info[1]!));
    if (product)
      return reply({
        text: `${product.name}\n${productFacts[product.id] ?? product.description}\n${formatPrice(product.priceOre)}${product.category === "wrap" ? ` för enkel wrap. Dubbel +${formatPrice(DOUBLE_SURCHARGE_ORE)}.` : "."}`,
      });
  }
  if (["oppettider", "nar har ni oppet", "nar kan jag bestalla"].includes(text))
    return reply({ text: ordinaryHoursText });
  const parsed = parseDemoRequest(raw);
  if (parsed.kind === "menu")
    return reply({
      ...toolReply("show_menu", {}, context),
    });
  if (parsed.kind === "cart")
    return reply({ text: describeCart(context.cart) });
  if (parsed.kind === "suggestion")
    return reply({
      text: "Så här tolkade jag dina val. Kontrollera dem och välj variant där det saknas.",
      action: { kind: "add", items: parsed.items },
    });
  return reply({
    text: "Fri dialog är inte ansluten i det här demoläget. Jag kan tolka enkla val, till exempel ”två dubbla Ghostdog och en Loka”, visa varukorgen eller svara på ”vem gör korven” och ”berätta om Ghostdog”. Du kan också välja från menyn. Inget har ändrats.",
  });
}
