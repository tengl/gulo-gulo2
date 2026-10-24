"use client";

import { demoMenu, DOUBLE_SURCHARGE_ORE, formatPrice } from "../index";
import type { Product } from "../index";
import { Icon } from "@/shared/Icon";
import { ProductInfoButton } from "./ProductInfoButton";

export function ChatMenu({
  onChoose,
  disabled,
}: {
  onChoose: (product: Product) => void;
  disabled: boolean;
}) {
  return (
    <div className="chat-menu" role="group" aria-label="Meny i chatten">
      <p className="chat-menu-hint">
        Tryck på namnet för mer info. Plusset väljer produkten.
      </p>
      {(["wrap", "drink"] as const).map((category) => (
        <div key={category}>
          <h3>{category === "wrap" ? "Korvwraps" : "Dryck"}</h3>
          <ul>
            {demoMenu
              .filter((product) => product.category === category)
              .map((product) => (
                <li key={product.id} className="chat-menu-product">
                  <div className="chat-menu-name">
                    {product.number && <small>{product.number}.</small>}
                    <ProductInfoButton product={product} />
                  </div>
                  <strong>{formatPrice(product.priceOre)}</strong>
                  <button
                    type="button"
                    className="chat-menu-choose"
                    disabled={disabled}
                    aria-label={`Välj ${product.name} i chatten`}
                    onClick={() => onChoose(product)}
                  >
                    <Icon name="plus" size={17} />
                  </button>
                </li>
              ))}
          </ul>
          {category === "wrap" && (
            <p>
              Enkelpriser. Dubbel wrap +{formatPrice(DOUBLE_SURCHARGE_ORE)}.
              Tryck på +, sedan enkel eller dubbel.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
