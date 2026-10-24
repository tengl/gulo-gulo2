"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  businessFacts,
  productFacts,
  formatPrice,
  unitPriceOre,
} from "../index";
import type { Product } from "../index";
import { Icon } from "@/shared/Icon";
import { Sheet, SheetPresence } from "@/shared/Sheet";

// UX-011: viewing facts is independent of cart changes and chat messages.
export function ProductInfoButton({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="product-info-button"
        aria-label={`Mer om ${product.name}`}
        aria-haspopup="dialog"
        title={`Mer om ${product.name}`}
        onClick={() => setOpen(true)}
      >
        <span>{product.name}</span>
        <Icon name="info" size={16} />
      </button>
      <SheetPresence>
        {open &&
          createPortal(
            <Sheet title={`Om ${product.name}`} onClose={() => setOpen(false)}>
              <span className="eyebrow">Produktinformation</span>
              <h2 className="sheet-title">{product.name}</h2>
              <p className="product-info-description">
                {productFacts[product.id] ?? product.description}
              </p>
              <dl className="product-info-prices">
                {product.category === "wrap" ? (
                  <>
                    <div>
                      <dt>Enkel wrap</dt>
                      <dd>{formatPrice(unitPriceOre(product.id, "single"))}</dd>
                    </div>
                    <div>
                      <dt>Dubbel wrap</dt>
                      <dd>{formatPrice(unitPriceOre(product.id, "double"))}</dd>
                    </div>
                  </>
                ) : (
                  <div>
                    <dt>Pris per dryck</dt>
                    <dd>{formatPrice(unitPriceOre(product.id))}</dd>
                  </div>
                )}
              </dl>
              {product.category === "wrap" && (
                <section className="product-info-accompaniments">
                  <h3>Bröd och tillbehör i menyn</h3>
                  <p>{businessFacts.accompaniments}</p>
                </section>
              )}
              <button
                type="button"
                className="product-info-back"
                onClick={() => setOpen(false)}
              >
                Tillbaka till menyn
              </button>
            </Sheet>,
            document.body,
          )}
      </SheetPresence>
    </>
  );
}
