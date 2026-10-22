"use client";

import { demoMenu, DOUBLE_SURCHARGE_ORE, formatPrice } from "../index";
import type { Product } from "../index";
import { Icon } from "@/shared/Icon";

export function ChatMenu({
  onChoose,
  disabled,
}: {
  onChoose: (product: Product) => void;
  disabled: boolean;
}) {
  return (
    <div className="chat-menu" role="group" aria-label="Meny i chatten">
      {(["wrap", "drink"] as const).map((category) => (
        <div key={category}>
          <h3>{category === "wrap" ? "Korvwraps" : "Dryck"}</h3>
          <ul>
            {demoMenu
              .filter((product) => product.category === category)
              .map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={`Beställ ${product.name}`}
                    onClick={() => onChoose(product)}
                  >
                    <span>
                      {product.number && <small>{product.number}.</small>}{" "}
                      {product.name}
                    </span>
                    <strong>{formatPrice(product.priceOre)}</strong>
                    <Icon name="plus" size={15} />
                  </button>
                </li>
              ))}
          </ul>
          {category === "wrap" && (
            <p>
              Enkelpriser. Dubbel wrap +{formatPrice(DOUBLE_SURCHARGE_ORE)}.
              Välj produkt, sedan enkel eller dubbel.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
