"use client";

import { useState } from "react";
import {
  getProduct,
  formatPrice,
  unitPriceOre,
  omissionLabels,
} from "@/modules/catalog";
import type { WrapVariant } from "@/modules/catalog";
import type { Cart, SavedOrder } from "@/modules/ordering";
import {
  describeCart,
  describeSavedOrder,
  canCancelDemoOrder,
} from "@/modules/ordering";
import type { ChatAction } from "../index";
import { ChatMenu } from "@/modules/catalog/ui/ChatMenu";

export function ChatProposal({
  action,
  cart,
  orders,
  stale,
  onApply,
  onNavigate,
  onSend,
  busy,
}: {
  action: ChatAction;
  cart: Cart;
  orders: readonly SavedOrder[];
  stale: boolean;
  onApply: (action: ChatAction) => string | undefined;
  onNavigate: (action: ChatAction) => void;
  onSend: (text: string) => void;
  busy: boolean;
}) {
  const [items, setItems] = useState(
    action.kind === "add" || action.kind === "replace" ? action.items : [],
  );
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const changesCart =
    action.kind === "add" ||
    action.kind === "replace" ||
    action.kind === "remove";
  if (done) return <p className="proposal-done">✓ Varukorgen är uppdaterad.</p>;
  if (changesCart && stale)
    return (
      <p className="proposal-stale">
        Varukorgen har ändrats sedan förslaget gjordes. Be om ett nytt förslag
        så att dina senaste val följer med.
      </p>
    );
  const complete = items.every(
    (item) =>
      getProduct(item.productId).category === "drink" ||
      item.variant !== undefined,
  );
  const order =
    action.kind === "cancel"
      ? orders.find((value) => value.reference === action.reference)
      : undefined;
  function apply() {
    const result = onApply(
      action.kind === "add" || action.kind === "replace"
        ? { ...action, items }
        : action,
    );
    if (result) setError(result);
    else setDone(true);
  }
  if (action.kind === "menu")
    return (
      <ChatMenu
        disabled={busy}
        onChoose={(product) => onSend(`Jag vill ha en ${product.name}`)}
      />
    );
  return (
    <div className="suggestion chat-proposal">
      {(action.kind === "add" || action.kind === "replace") && (
        <>
          <h3>
            {action.kind === "replace"
              ? "Ny varukorg · ersätter alla nuvarande val"
              : "Förslag att lägga till"}
          </h3>
          {items.map((item, index) => {
            const product = getProduct(item.productId);
            return (
              <div className="suggestion-line" key={index}>
                <div>
                  <strong>
                    {item.quantity} × {product.name}
                  </strong>
                  {item.omissions.length > 0 && (
                    <small>
                      Utan{" "}
                      {item.omissions
                        .map((id) => omissionLabels[id])
                        .join(", ")}
                    </small>
                  )}
                  {product.category === "drink" && (
                    <small>
                      {formatPrice(unitPriceOre(product.id) * item.quantity)}
                    </small>
                  )}
                </div>
                {product.category === "wrap" && (
                  <select
                    aria-label={`Variant för ${product.name}`}
                    value={item.variant ?? ""}
                    onChange={(event) => {
                      const variant = event.target.value as WrapVariant | "";
                      setItems((current) =>
                        current.map((value, position) =>
                          position === index
                            ? { ...value, variant: variant || undefined }
                            : value,
                        ),
                      );
                    }}
                  >
                    <option value="">Välj enkel eller dubbel</option>
                    <option value="single">
                      Enkel · {formatPrice(unitPriceOre(product.id, "single"))}
                    </option>
                    <option value="double">
                      Dubbel · {formatPrice(unitPriceOre(product.id, "double"))}
                    </option>
                  </select>
                )}
              </div>
            );
          })}
          <button
            type="button"
            className="primary-button"
            disabled={!complete}
            onClick={apply}
          >
            {action.kind === "replace"
              ? "Godkänn ny varukorg"
              : "Lägg till dessa val"}
          </button>
        </>
      )}
      {action.kind === "remove" && (
        <>
          <h3>Ta bort från varukorgen</h3>
          <p className="chat-prose">
            {describeCart(
              cart.filter((line) => action.keys.includes(line.key)),
            )}
          </p>
          <button type="button" className="primary-button" onClick={apply}>
            Bekräfta borttagning
          </button>
        </>
      )}
      {action.kind === "cancel" && (
        <>
          <h3>
            {order?.status === "cancelled"
              ? "Demobeställningen är avbokad"
              : "Avboka demobeställning"}
          </h3>
          <p className="order-reference">{action.reference}</p>
          {order && <p className="chat-prose">{describeSavedOrder(order)}</p>}
          <button
            type="button"
            className="primary-button"
            disabled={!order || !canCancelDemoOrder(order)}
            onClick={() => onNavigate(action)}
          >
            Granska avbokningen
          </button>
        </>
      )}
      {(action.kind === "review" || action.kind === "orders") && (
        <button
          type="button"
          className="primary-button"
          onClick={() => onNavigate(action)}
        >
          {action.kind === "review"
            ? "Granska beställningen"
            : "Mina beställningar"}
        </button>
      )}
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
    </div>
  );
}
