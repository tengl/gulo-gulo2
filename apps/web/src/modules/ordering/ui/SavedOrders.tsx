"use client";

import { getProduct, formatPrice, omissionLabels } from "@/modules/catalog";
import type { SavedOrder } from "../index";
import {
  canCancelDemoOrder,
  demoOrderStatusLabels,
  demoOrderPreparationLabels,
} from "../index";
import { Icon } from "@/shared/Icon";

export function SavedOrderDetails({ order }: { order: SavedOrder }) {
  return (
    <>
      <p className="order-reference">{order.reference}</p>
      {order.status !== "cancelled" && order.status !== "collected" && (
        <p className={`order-preparation preparation-${order.preparation}`}>
          {demoOrderPreparationLabels[order.preparation]} · demo
        </p>
      )}
      <ul className="saved-order-lines">
        {order.cart.map((line, index) => (
          <li key={line.key}>
            <span>
              {line.quantity} × {getProduct(line.productId).name}
              <small>
                {line.variant
                  ? line.variant === "double"
                    ? "Dubbel wrap"
                    : "Enkel wrap"
                  : "Dryck"}
                {line.omissions.length > 0 &&
                  ` · utan ${line.omissions.map((id) => omissionLabels[id]).join(", ")}`}
              </small>
            </span>
            <strong>
              {formatPrice(order.pricesOre[index]! * line.quantity)}
            </strong>
          </li>
        ))}
      </ul>
      <div className="saved-order-total">
        <span>Totalt</span>
        <strong>{formatPrice(order.totalOre)}</strong>
      </div>
    </>
  );
}

export function SavedOrders({
  orders,
  onCancel,
  onForget,
  onMenu,
}: {
  orders: readonly SavedOrder[];
  onCancel: (reference: string) => void;
  onForget: () => void;
  onMenu: () => void;
}) {
  return (
    <section className="saved-orders" aria-labelledby="saved-orders-title">
      <span className="eyebrow">Tillbaka till dina val</span>
      <h1 id="saved-orders-title">Mina beställningar</h1>
      <p className="saved-intro">
        Lokala demobeställningar på den här enheten. Inget har skickats till
        köket, betalats eller reserverats.
      </p>
      {!orders.length && (
        <div className="saved-empty">
          <Icon name="bag" size={36} />
          <h2>Här dyker dina beställningar upp.</h2>
          <p>
            Spara en demobeställning efter att du granskat dina val, så finns
            den kvar när du kommer tillbaka.
          </p>
          <button type="button" className="primary-button" onClick={onMenu}>
            Välj från menyn <Icon name="arrow" />
          </button>
        </div>
      )}
      <div className="saved-order-list">
        {orders.map((order) => (
          <article
            className="saved-order"
            key={order.reference}
            aria-label={`Demobeställning ${order.reference}`}
          >
            <div className="saved-order-heading">
              <time dateTime={order.createdAt}>
                {new Intl.DateTimeFormat("sv-SE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Europe/Stockholm",
                }).format(new Date(order.createdAt))}
              </time>
              <span className={`order-status status-${order.status}`}>
                {demoOrderStatusLabels[order.status]}
              </span>
            </div>
            <SavedOrderDetails order={order} />
            {order.status === "paid" && (
              <p className="sheet-description">
                Markerad som betald i adminförhandsvisningen. Efter betalning
                kontaktar du personalen för avbokning. Ingen riktig betalning
                har gjorts.
              </p>
            )}
            {order.status === "collected" && (
              <p className="sheet-description">
                Markerad som hämtad i adminförhandsvisningen. Ingen riktig
                utlämning har registrerats.
              </p>
            )}
            {canCancelDemoOrder(order) && (
              <button
                type="button"
                className="text-button"
                onClick={() => onCancel(order.reference)}
              >
                Avboka demobeställning <Icon name="close" size={16} />
              </button>
            )}
          </article>
        ))}
      </div>
      <div className="memory-note">
        <p>
          Referenser och innehåll sparas i webbläsaren. Inga kontaktuppgifter
          behövs. Det lokala minnet kan inte användas för att hämta riktiga
          ordrar på andra enheter.
        </p>
        <button type="button" className="text-button" onClick={onForget}>
          Rensa lokalt minne
        </button>
      </div>
    </section>
  );
}
