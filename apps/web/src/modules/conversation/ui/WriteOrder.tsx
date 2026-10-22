"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  getProduct,
  formatPrice,
  unitPriceOre,
  omissionLabels,
} from "@/modules/catalog";
import type { WrapVariant } from "@/modules/catalog";
import type { Selection } from "@/modules/ordering";
import { parseDemoRequest } from "../index";
import type { SuggestedItem } from "../index";
import { Icon } from "@/shared/Icon";

export function WriteOrder({
  onAdd,
  onMenu,
  onCart,
}: {
  onAdd: (items: Selection[]) => boolean;
  onMenu: () => void;
  onCart: () => void;
}) {
  const [text, setText] = useState("");
  const [items, setItems] = useState<SuggestedItem[] | null>(null);
  const [message, setMessage] = useState("");
  function interpret(event?: FormEvent) {
    event?.preventDefault();
    const result = parseDemoRequest(text);
    setItems(null);
    if (result.kind === "menu") onMenu();
    else if (result.kind === "cart") onCart();
    else if (result.kind === "clarify") setMessage(result.message);
    else if (result.kind === "suggestion") {
      setItems(result.items);
      setMessage(
        "Kontrollera att jag har förstått rätt och välj variant där det saknas.",
      );
    }
  }
  const complete = items?.every(
    (item) =>
      getProduct(item.productId).category === "drink" ||
      item.variant !== undefined,
  );
  return (
    <section className="write-order" aria-labelledby="write-heading">
      <span className="eyebrow">Du bestämmer hur</span>
      <h2 id="write-heading">Skriv vad du är sugen på.</h2>
      <p>
        Flera val i samma mening går bra. Du får alltid kontrollera förslaget
        innan något läggs till.
      </p>
      <div className="example-order">
        <span>Prova till exempel</span>
        <button
          type="button"
          onClick={() => {
            setText("Två dubbla Ghostdog och en Loka");
            setItems(null);
            setMessage("");
          }}
        >
          Två dubbla Ghostdog och en Loka <Icon name="arrow" size={18} />
        </button>
      </div>
      <form onSubmit={interpret}>
        <label htmlFor="order-text">Din beställning i text</label>
        <textarea
          id="order-text"
          maxLength={600}
          rows={3}
          value={text}
          required
          placeholder="Till exempel: två dubbla Ghostdog och en Loka"
          onChange={(event) => {
            setText(event.target.value);
            setItems(null);
            setMessage("");
          }}
        />
        <button type="submit" className="primary-button">
          Visa mitt förslag <Icon name="arrow" />
        </button>
      </form>
      <p className="text-demo-note">
        Textfunktionen i demon förstår enkla produktval och antal. Fri AI-dialog
        och röst kommer senare.
      </p>
      <div aria-live="polite">
        {message && <p className="interpretation-message">{message}</p>}
      </div>
      {items && (
        <div className="suggestion">
          <h3>Så här tolkade jag det</h3>
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
                        .map((value) => omissionLabels[value])
                        .join(", ")}
                    </small>
                  )}
                </div>
                {product.category === "wrap" && (
                  <select
                    aria-label={`Variant för ${product.name}`}
                    value={item.variant ?? ""}
                    onChange={(event) => {
                      const variant = event.target.value as WrapVariant | "";
                      setItems(
                        (current) =>
                          current?.map((value, position) =>
                            position === index
                              ? { ...value, variant: variant || undefined }
                              : value,
                          ) ?? null,
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
            className="primary-button"
            type="button"
            disabled={!complete}
            onClick={() => {
              if (onAdd(items)) {
                setItems(null);
                setText("");
                setMessage(
                  "Dina val är tillagda. Skriv något mer eller fortsätt i menyn.",
                );
              }
            }}
          >
            Lägg till dessa val <Icon name="plus" />
          </button>
        </div>
      )}
    </section>
  );
}
