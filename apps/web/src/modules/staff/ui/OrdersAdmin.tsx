"use client";

import Link from "next/link";
import { useState } from "react";
import { OrderAdminDetails, type AdminOrderTarget } from "./OrderAdminDetails";
import { formatPrice, getProduct } from "@/modules/catalog";
import {
  changeDemoOrderStatus,
  changeDemoOrderPreparation,
  demoOrderPreparationLabels,
  demoOrderStatusLabels,
  type SavedOrder,
} from "@/modules/ordering";
import { useOrderMemory } from "@/modules/ordering/ui";
import { Icon } from "@/shared/Icon";
import { SheetPresence } from "@/shared/Sheet";
import {
  filterAdminOrders,
  summarizeAdminOrders,
  type OrderFilters,
} from "../index";

const labels = {
  saved: "Obetalda",
  paid: "Betalda",
  collected: "Hämtade",
  cancelled: "Avbokade",
} as const;
const createdLabel = (value: string) =>
  new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Stockholm",
  }).format(new Date(value));

export function OrdersAdmin({ today }: { today: string }) {
  const { memory, ready, error: storageError, updateMemory } = useOrderMemory();
  const [filters, setFilters] = useState<OrderFilters>({
    query: "",
    date: today,
    status: "all",
  });
  const [selected, setSelected] = useState<string | null>(null);
  const orders = storageError ? [] : filterAdminOrders(memory.orders, filters);
  const summary = summarizeAdminOrders(orders);
  const selectedOrder = memory.orders.find(
    (order) => order.reference === selected,
  );
  async function changeOrder(
    reference: string,
    expected: string,
    target: AdminOrderTarget,
  ) {
    const response = await fetch("/api/admin/session", { cache: "no-store" });
    if (response.status === 401) {
      window.location.reload();
      throw new Error("Sessionen har gått ut. Logga in igen.");
    }
    if (!response.ok)
      throw new Error(
        "Kunde inte kontrollera inloggningen. Inget har ändrats.",
      );
    updateMemory(
      (current) =>
        target === "confirmed" ||
        target === "preparing" ||
        target === "prepared"
          ? changeDemoOrderPreparation(current, reference, expected, target)
          : changeDemoOrderStatus(current, reference, expected, target),
      true,
    );
  }
  return (
    <>
      <div className="admin-page-title">
        <div>
          <span className="eyebrow">Håll ihop beställningarna</span>
          <h1>Beställningar</h1>
          <p>Överblick, innehåll och nästa steg.</p>
        </div>
        <Link className="admin-secondary" href="/">
          Öppna beställningen <Icon name="arrow" size={16} />
        </Link>
      </div>
      <aside className="admin-notice">
        <span className="admin-status-dot" />
        <div>
          <strong>Lokala demobeställningar</strong>
          <p>
            Här visas beställningar sparade i den här webbläsaren.
            Statusändringar är simuleringar som även syns på kundsidan. Inga
            riktiga betalningar eller utlämningar registreras.
          </p>
        </div>
      </aside>
      {storageError ? (
        <div className="admin-error" role="alert">
          <strong>Beställningarna kunde inte läsas</strong>
          <p>
            Det lokala minnet är skadat eller blockerat. Kontrollera
            webbläsarens lagring eller öppna Mina beställningar på kundsidan för
            att hantera minnet. Ingen tom orderlista eller totalsumma kan
            bekräftas.
          </p>
        </div>
      ) : !ready ? (
        <p role="status">Läser lokala beställningar…</p>
      ) : (
        <>
          <section
            className="admin-order-filters"
            aria-label="Filtrera beställningar"
          >
            <label className="admin-order-search">
              Sök beställning
              <input
                type="search"
                placeholder="Referens eller produkt…"
                value={filters.query}
                onChange={(event) =>
                  setFilters({ ...filters, query: event.target.value })
                }
              />
            </label>
            <label className="admin-order-date">
              Sparad den
              <input
                type="date"
                value={filters.date}
                onChange={(event) =>
                  setFilters({ ...filters, date: event.target.value })
                }
              />
            </label>
            <label className="admin-preparation-filter">
              Mottagning och tillagning
              <select
                aria-label="Mottagning och tillagning"
                value={filters.preparation ?? "all"}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    preparation: event.target
                      .value as OrderFilters["preparation"],
                  })
                }
              >
                <option value="all">Alla steg</option>
                {Object.entries(demoOrderPreparationLabels).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>
            <button
              className="admin-secondary"
              onClick={() =>
                setFilters({
                  ...filters,
                  date: filters.date === today ? "" : today,
                })
              }
            >
              {filters.date === today ? "Alla datum" : "Idag"}
            </button>
            <div
              className="admin-order-tabs"
              role="group"
              aria-label="Beställningsstatus"
            >
              <button
                aria-pressed={filters.status === "all"}
                onClick={() => setFilters({ ...filters, status: "all" })}
              >
                Alla
              </button>
              {Object.entries(labels).map(([status, label]) => (
                <button
                  key={status}
                  aria-pressed={filters.status === status}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      status: status as SavedOrder["status"],
                    })
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
          <section
            className="admin-order-stats"
            aria-label="Summering av filtrerade demobeställningar"
          >
            <div>
              <span>Beställningar</span>
              <strong>{summary.orderCount}</strong>
              <small>Ej avbokade i urvalet</small>
            </div>
            <div>
              <span>Wraps</span>
              <strong>{summary.wrapCount}</strong>
              <small>Dubbel räknas som en wrap</small>
            </div>
            <div>
              <span>Sammanlagt demobelopp</span>
              <strong>{formatPrice(summary.totalOre)}</strong>
              <small>Ej avbokade · ingen omsättning</small>
            </div>
          </section>
          <section
            className="admin-orders-panel"
            aria-labelledby="admin-orders-title"
          >
            <div className="admin-section-head">
              <div>
                <span className="eyebrow">Sparade beställningar</span>
                <h2 id="admin-orders-title">
                  {filters.date === today
                    ? "Sparade idag"
                    : filters.date
                      ? `Sparade ${filters.date}`
                      : "Alla datum"}
                </h2>
              </div>
              <span className="admin-order-count">{orders.length} träffar</span>
            </div>
            <p className="admin-order-date-note">
              Datum och tid avser när beställningen sparades. Hämtningstid och
              kunduppgifter finns ännu inte i demon.
            </p>
            {orders.length ? (
              <ul className="admin-orders-list">
                {orders.map((order) => (
                  <li key={order.reference}>
                    <article
                      className="admin-order-card"
                      aria-label={`Beställning ${order.reference}`}
                    >
                      <div className="admin-order-card-top">
                        <time dateTime={order.createdAt}>
                          {createdLabel(order.createdAt)}
                        </time>
                        <span
                          className={`admin-order-status status-${order.status}`}
                        >
                          {order.status === "saved"
                            ? "Obetald · demo"
                            : demoOrderStatusLabels[order.status]}
                        </span>
                      </div>
                      <p className="admin-order-reference">{order.reference}</p>
                      {order.status !== "cancelled" &&
                        order.status !== "collected" && (
                          <p
                            className={`order-preparation preparation-${order.preparation}`}
                          >
                            {demoOrderPreparationLabels[order.preparation]} ·
                            demo
                          </p>
                        )}
                      <p className="admin-order-summary">
                        {order.cart
                          .map(
                            (line) =>
                              `${line.quantity} × ${getProduct(line.productId).name}${line.variant === "double" ? " (dubbel)" : ""}`,
                          )
                          .join(" · ")}
                      </p>
                      <div className="admin-order-card-bottom">
                        <strong>{formatPrice(order.totalOre)}</strong>
                        <button
                          className="admin-secondary"
                          onClick={() => setSelected(order.reference)}
                        >
                          Visa beställning <Icon name="arrow" size={16} />
                        </button>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="admin-orders-empty">
                <Icon name="bag" size={34} />
                <h3>
                  {memory.orders.length
                    ? "Inga beställningar matchar"
                    : "Inga sparade demobeställningar ännu"}
                </h3>
                <p>
                  {memory.orders.length
                    ? "Ändra filtren för att se fler sparade beställningar."
                    : "Spara en demobeställning på kundsidan, så visas den här på samma enhet."}
                </p>
                {memory.orders.length ? (
                  <button
                    className="admin-secondary"
                    onClick={() =>
                      setFilters({ query: "", date: "", status: "all" })
                    }
                  >
                    Visa alla beställningar
                  </button>
                ) : (
                  <Link className="admin-secondary" href="/">
                    Prova att beställa <Icon name="arrow" size={16} />
                  </Link>
                )}
              </div>
            )}
          </section>
        </>
      )}
      <SheetPresence>
        {Boolean(selected) && (
          <OrderAdminDetails
            order={selectedOrder}
            storageError={storageError}
            onChange={changeOrder}
            onClose={() => setSelected(null)}
          />
        )}
      </SheetPresence>
    </>
  );
}
