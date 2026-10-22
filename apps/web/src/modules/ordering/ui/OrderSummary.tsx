"use client";

import {
  getProduct,
  formatPrice,
  unitPriceOre,
  omissionLabels,
  MAX_DEMO_QUANTITY,
} from "@/modules/catalog";
import { cartCount, cartTotalOre } from "../index";
import type { Cart } from "../index";
import { Icon } from "@/shared/Icon";

type Props = {
  cart: Cart;
  onQuantity?: (key: string, quantity: number) => void;
  onRemove?: (key: string) => void;
  onReview?: () => void;
  onBrowse?: () => void;
};

export function OrderSummary({
  cart,
  onQuantity,
  onRemove,
  onReview,
  onBrowse,
}: Props) {
  return (
    <div className="order-summary">
      <div className="summary-heading">
        <span className="summary-icon">
          <Icon name="bag" size={24} />
        </span>
        <div>
          <span className="eyebrow">Dina val, samlade</span>
          <h2>Din beställning</h2>
        </div>
        <span className="item-count">{cartCount(cart)}</span>
      </div>
      {!cart.length ? (
        <div className="empty-cart">
          <div className="empty-illustration">
            <Icon name="bag" size={40} />
            <span>+</span>
          </div>
          <h3>Vad är du sugen på?</h3>
          <p>
            Välj något från menyn.
            <br />
            Din beställning tar form här.
          </p>
          {onBrowse && (
            <button type="button" className="text-button" onClick={onBrowse}>
              Hitta en favorit <Icon name="arrow" size={16} />
            </button>
          )}
        </div>
      ) : (
        <ul className="cart-lines">
          {cart.map((line) => {
            const product = getProduct(line.productId);
            return (
              <li key={line.key} className="cart-line">
                <div className="cart-line-top">
                  <div>
                    <h3>{product.name}</h3>
                    <p>
                      {product.category === "wrap"
                        ? line.variant === "double"
                          ? "Dubbel wrap"
                          : "Enkel wrap"
                        : "Dryck"}
                    </p>
                    {line.omissions.length > 0 && (
                      <p className="omission-note">
                        Utan{" "}
                        {line.omissions
                          .map((item) => omissionLabels[item])
                          .join(", ")}
                      </p>
                    )}
                  </div>
                  {onRemove && (
                    <button
                      type="button"
                      className="icon-button remove-line"
                      aria-label={`Ta bort ${product.name}`}
                      onClick={() => onRemove(line.key)}
                    >
                      <Icon name="trash" size={17} />
                    </button>
                  )}
                </div>
                <div className="cart-line-bottom">
                  {onQuantity ? (
                    <div className="quantity-control small">
                      <button
                        type="button"
                        aria-label={`Minska antal ${product.name}`}
                        disabled={line.quantity <= 1}
                        onClick={() => onQuantity(line.key, line.quantity - 1)}
                      >
                        <Icon name="minus" size={16} />
                      </button>
                      <output aria-label={`Antal ${product.name}`}>
                        {line.quantity}
                      </output>
                      <button
                        type="button"
                        aria-label={`Öka antal ${product.name}`}
                        disabled={line.quantity >= MAX_DEMO_QUANTITY}
                        onClick={() => onQuantity(line.key, line.quantity + 1)}
                      >
                        <Icon name="plus" size={16} />
                      </button>
                    </div>
                  ) : (
                    <span>
                      {line.quantity} st ·{" "}
                      {formatPrice(unitPriceOre(line.productId, line.variant))}
                      /st
                    </span>
                  )}
                  <strong>
                    {formatPrice(
                      unitPriceOre(line.productId, line.variant) *
                        line.quantity,
                    )}
                  </strong>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="summary-total">
        <span>Totalt</span>
        <strong>{formatPrice(cartTotalOre(cart))}</strong>
      </div>
      {onReview && (
        <button
          type="button"
          className="primary-button"
          disabled={!cart.length}
          onClick={onReview}
        >
          Granska beställningen <Icon name="arrow" />
        </button>
      )}
      <p className="summary-hint">
        <span className="tiny-dot" /> Demoläge · Ingenting skickas till köket
      </p>
    </div>
  );
}
