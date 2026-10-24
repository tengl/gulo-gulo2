"use client";

import { useState } from "react";
import { demoMenu, formatPrice } from "../index";
import type { Product } from "../index";
import { Icon } from "@/shared/Icon";
import { ProductInfoButton } from "./ProductInfoButton";

export function ProductMenu({
  onChoose,
}: {
  onChoose: (product: Product) => void;
}) {
  const [category, setCategory] = useState<"wrap" | "drink">("wrap");
  return (
    <section aria-labelledby="menu-heading" className="menu-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Hitta din favorit</span>
          <h2 id="menu-heading">På menyn</h2>
        </div>
        <span className="menu-note">Alla priser i kr</span>
      </div>
      <div
        className="category-switch"
        role="group"
        aria-label="Produktkategori"
      >
        <button
          type="button"
          aria-pressed={category === "wrap"}
          onClick={() => setCategory("wrap")}
        >
          Korvwraps <span>9</span>
        </button>
        <button
          type="button"
          aria-pressed={category === "drink"}
          onClick={() => setCategory("drink")}
        >
          Dryck{" "}
          <span>
            {demoMenu.filter((item) => item.category === "drink").length}
          </span>
        </button>
      </div>
      <p className="category-intro">
        {category === "wrap"
          ? "I mjukt tunnbröd med picklad gurka och rödlök, rostad lök och senap. Välj din sort, sedan enkel eller dubbel."
          : "Något att dricka till? Lägg till precis så många du vill ha."}
      </p>
      <div className="product-grid">
        {demoMenu
          .filter((product) => product.category === category)
          .map((product) => (
            <article
              className={`product-card ${product.id === "grillost" ? "product-vegetarian" : ""}`}
              key={product.id}
            >
              <div className="product-top">
                <span className="product-number">
                  {product.number
                    ? String(product.number).padStart(2, "0")
                    : "↗"}
                </span>
                {product.badge && (
                  <span
                    className={`product-badge ${product.badge === "Stark" ? "badge-hot" : ""}`}
                  >
                    {product.badge}
                  </span>
                )}
              </div>
              <h3>
                <ProductInfoButton product={product} />
              </h3>
              <p>{product.description}</p>
              <div className="product-bottom">
                <span>{formatPrice(product.priceOre)}</span>
                <button
                  className="add-circle"
                  type="button"
                  onClick={() => onChoose(product)}
                  aria-label={`Välj ${product.name}`}
                >
                  <Icon name="plus" />
                </button>
              </div>
            </article>
          ))}
      </div>
      <p className="menu-footnote">
        Demomeny från tidigare version. Inga uppgifter om aktuellt lager visas.
      </p>
    </section>
  );
}
