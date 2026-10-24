"use client";

import { useState } from "react";
import {
  unitPriceOre,
  formatPrice,
  omissionLabels,
  MAX_DEMO_QUANTITY,
} from "@/modules/catalog";
import type { Product, WrapVariant, Omission } from "@/modules/catalog";
import type { Selection } from "@/modules/ordering";
import { Sheet } from "@/shared/Sheet";
import { Icon } from "@/shared/Icon";

export function ConfigureProduct({
  product,
  onClose,
  onAdd,
}: {
  product: Product;
  onClose: () => void;
  onAdd: (items: Selection[]) => string | undefined;
}) {
  const [variant, setVariant] = useState<WrapVariant>();
  const [quantity, setAmount] = useState(1);
  const [omissions, setOmissions] = useState<Omission[]>([]);
  const [addError, setAddError] = useState("");
  const ready = product.category === "drink" || variant !== undefined;
  return (
    <Sheet title={`Välj ${product.name}`} onClose={onClose}>
      <span className="eyebrow">
        {product.number
          ? `${String(product.number).padStart(2, "0")} / Din korvwrap`
          : "Något att dricka"}
      </span>
      <h2 className="sheet-title">{product.name}</h2>
      <p className="sheet-description">{product.description}</p>
      {product.category === "wrap" && (
        <fieldset className="variant-options">
          <legend>Enkel eller dubbel?</legend>
          {(["single", "double"] as const).map((size) => (
            <label
              key={size}
              className={
                variant === size
                  ? "variant-option is-selected"
                  : "variant-option"
              }
            >
              <input
                type="radio"
                name="variant"
                value={size}
                checked={variant === size}
                onChange={() => setVariant(size)}
              />
              <span>
                <strong>
                  {size === "single" ? "Enkel wrap" : "Dubbel wrap"}
                </strong>
                <small>
                  {size === "single"
                    ? "En korv eller portion grillost"
                    : "Två av samma sort i ett tunnbröd"}
                </small>
              </span>
              <b>{formatPrice(unitPriceOre(product.id, size))}</b>
            </label>
          ))}
        </fieldset>
      )}
      {product.category === "wrap" && (
        <details className="customize">
          <summary>
            Välj bort tillbehör <span>Valfritt</span>
          </summary>
          <div className="omission-options">
            {(Object.entries(omissionLabels) as [Omission, string][]).map(
              ([id, label]) => (
                <label key={id}>
                  <input
                    type="checkbox"
                    checked={omissions.includes(id)}
                    onChange={(event) =>
                      setOmissions((previous) =>
                        event.target.checked
                          ? [...previous, id]
                          : previous.filter((value) => value !== id),
                      )
                    }
                  />
                  Utan {label}
                </label>
              ),
            )}
          </div>
        </details>
      )}
      <div className="quantity-row">
        <span>Antal</span>
        <div className="quantity-control">
          <button
            type="button"
            disabled={quantity <= 1}
            aria-label="Minska antal"
            onClick={() => setAmount(quantity - 1)}
          >
            <Icon name="minus" />
          </button>
          <output aria-label="Antal att lägga till">{quantity}</output>
          <button
            type="button"
            disabled={quantity >= MAX_DEMO_QUANTITY}
            aria-label="Öka antal"
            onClick={() => setAmount(quantity + 1)}
          >
            <Icon name="plus" />
          </button>
        </div>
      </div>
      {addError && (
        <p className="inline-error" role="alert">
          {addError}
        </p>
      )}
      <button
        type="button"
        className="primary-button"
        disabled={!ready}
        onClick={() => {
          const failure = onAdd([
            { productId: product.id, quantity, variant, omissions },
          ]);
          if (failure) setAddError(`Inget har lagts till. ${failure}`);
          else onClose();
        }}
      >
        <span>
          {ready ? "Lägg till i beställningen" : "Välj enkel eller dubbel"}
        </span>
        {ready && (
          <strong>
            {formatPrice(unitPriceOre(product.id, variant) * quantity)}
          </strong>
        )}
      </button>
      <p className="sheet-footnote">
        Du kan ändra antal och ta bort dina val innan du går vidare.
      </p>
    </Sheet>
  );
}
