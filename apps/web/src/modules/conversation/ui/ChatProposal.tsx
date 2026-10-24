"use client";

import { useRef, useState } from "react";
import {
  getProduct,
  formatPrice,
  unitPriceOre,
  omissionLabels,
} from "@/modules/catalog";
import type { Cart, SavedOrder } from "@/modules/ordering";
import {
  describeCart,
  describeSavedOrder,
  canCancelDemoOrder,
} from "@/modules/ordering";
import type { ChatAction } from "../index";
import { ChatMenu } from "@/modules/catalog/ui/ChatMenu";
import { Icon } from "@/shared/Icon";

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
  const applied = useRef(false);
  const onlyItem = items.length === 1 ? items[0] : undefined;
  const directVariantAdd =
    action.kind === "add" &&
    onlyItem !== undefined &&
    getProduct(onlyItem.productId).category === "wrap" &&
    onlyItem.variant === undefined;
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
  function apply(nextItems = items) {
    if (applied.current) return;
    applied.current = true;
    const result = onApply(
      action.kind === "add" || action.kind === "replace"
        ? { ...action, items: nextItems }
        : action,
    );
    if (result) {
      applied.current = false;
      setError(result);
    } else setDone(true);
  }
  if (action.kind === "menu")
    return (
      <ChatMenu
        disabled={busy}
        onChoose={(product) => onSend(`Jag vill ha en ${product.name}`)}
      />
    );
  if (
    action.kind === "cart" ||
    action.kind === "review" ||
    action.kind === "orders"
  )
    return (
      <div className="chat-actions">
        {action.kind === "cart" && (
          <button
            type="button"
            className="chat-link"
            onClick={() => onNavigate({ kind: "cart" })}
          >
            Ändra <Icon name="write" size={15} />
          </button>
        )}
        {(action.kind === "review" ||
          (action.kind === "cart" && cart.length > 0)) && (
          <button
            type="button"
            className="chat-link"
            onClick={() => onNavigate({ kind: "review" })}
          >
            Granska beställningen <Icon name="arrow" size={16} />
          </button>
        )}
        {action.kind === "orders" && (
          <button
            type="button"
            className="chat-link"
            onClick={() => onNavigate(action)}
          >
            Mina beställningar <Icon name="arrow" size={16} />
          </button>
        )}
      </div>
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
                  <div
                    className="proposal-variants"
                    role="group"
                    aria-label={`Variant för ${product.name}`}
                  >
                    {(["single", "double"] as const).map((variant) => {
                      const label = variant === "single" ? "Enkel" : "Dubbel";
                      const price = formatPrice(
                        unitPriceOre(product.id, variant) * item.quantity,
                      );
                      return (
                        <button
                          key={variant}
                          type="button"
                          className={
                            directVariantAdd
                              ? "primary-button variant-add"
                              : "variant-choice"
                          }
                          aria-pressed={
                            directVariantAdd
                              ? undefined
                              : item.variant === variant
                          }
                          aria-label={
                            directVariantAdd
                              ? `Lägg till ${label.toLowerCase()} wrap, ${item.quantity} × ${product.name}, ${price}`
                              : undefined
                          }
                          onClick={() => {
                            const next = items.map((value, position) =>
                              position === index
                                ? { ...value, variant }
                                : value,
                            );
                            if (directVariantAdd) apply(next);
                            else setItems(next);
                          }}
                        >
                          {directVariantAdd && (
                            <span className="variant-action">
                              <Icon name="plus" size={14} /> Lägg till
                            </span>
                          )}
                          <strong>
                            {label}
                            {!directVariantAdd && item.variant === variant && (
                              <Icon name="check" size={14} />
                            )}
                          </strong>
                          <span>{price}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {!directVariantAdd && (
            <>
              {items.some(
                (item) => getProduct(item.productId).category === "wrap",
              ) && (
                <p className="variant-hint">
                  Välj variant ovan. Varukorgen ändras när du godkänner nedan.
                </p>
              )}
              <button
                type="button"
                className="primary-button"
                disabled={!complete}
                onClick={() => apply()}
              >
                {action.kind === "replace"
                  ? "Godkänn ny varukorg"
                  : "Lägg till dessa val"}
                <Icon
                  name={action.kind === "replace" ? "check" : "plus"}
                  size={16}
                />
              </button>
            </>
          )}
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
          <button
            type="button"
            className="primary-button"
            onClick={() => apply()}
          >
            Bekräfta borttagning
            <Icon name="trash" size={16} />
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
            className="proposal-navigation"
            disabled={!order || !canCancelDemoOrder(order)}
            onClick={() => onNavigate(action)}
          >
            Granska avbokningen
            <Icon name="arrow" size={16} />
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
    </div>
  );
}
