"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductMenu } from "@/modules/catalog/ui/ProductMenu";
import { demoMenu, formatPrice } from "@/modules/catalog";
import type { Product } from "@/modules/catalog";
import { OrderingHours } from "@/modules/business-hours/ui/OrderingHours";
import {
  addSelections,
  setQuantity,
  removeLine,
  cartCount,
  cartTotalOre,
  cartFingerprint,
  saveDemoOrder,
  cancelDemoOrder,
} from "@/modules/ordering";
import type { Cart, Selection } from "@/modules/ordering";
import { OrderSummary } from "@/modules/ordering/ui/OrderSummary";
import { Icon } from "@/shared/Icon";
import {
  ReviewOrder,
  CancelOrder,
  ForgetMemory,
} from "@/modules/ordering/ui/OrderDialogs";
import { ConfigureProduct } from "./ConfigureProduct";
import { Chat } from "./Chat";
import { StoreHeader } from "./StoreHeader";
import { useOrderingView } from "./useOrderingView";
import { SheetPresence } from "@/shared/Sheet";
import { useHydrated } from "@/shared/useHydrated";
import { applyCartProposal } from "../index";
import type { ChatAction } from "../index";
import { useOrderMemory } from "@/modules/ordering/ui/useOrderMemory";
import { SavedOrders } from "@/modules/ordering/ui/SavedOrders";

export function OrderingExperience() {
  const { view, setView, root } = useOrderingView();
  const hydrated = useHydrated();
  const {
    memory,
    error: memoryError,
    ready,
    updateMemory,
    forgetMemory,
  } = useOrderMemory();
  const cart = memory.cart;
  const [sessionKey, setSessionKey] = useState(0);
  const [cancelReference, setCancelReference] = useState<string | null>(null);
  const [forget, setForget] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [reviewCart, setReviewCart] = useState<Cart | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const count = cartCount(cart);
  function add(items: Selection[]): boolean {
    try {
      updateMemory((current) => ({
        ...current,
        cart: addSelections(current.cart, items),
      }));
      setError("");
      setNotice("Dina val har lagts till i beställningen.");
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Kunde inte lägga till dina val.",
      );
      return false;
    }
  }
  function changeQuantity(key: string, quantity: number) {
    try {
      updateMemory((current) => ({
        ...current,
        cart: setQuantity(current.cart, key, quantity),
      }));
      setError("");
      setNotice("Antalet är uppdaterat.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Kunde inte ändra antalet.",
      );
    }
  }
  function applyAction(action: ChatAction, base: string): string | undefined {
    try {
      updateMemory((current) => ({
        ...current,
        cart: applyCartProposal(current.cart, action, base),
      }));
      return undefined;
    } catch (cause) {
      return cause instanceof Error
        ? cause.message
        : "Kunde inte ändra varukorgen.";
    }
  }
  function navigate(action: ChatAction) {
    if (action.kind === "cart") setView("cart");
    if (action.kind === "menu") setView("menu");
    if (action.kind === "orders") setView("orders");
    if (action.kind === "review") {
      if (cart.length) setReviewCart(cart);
      else setNotice("Din varukorg är tom. Välj något innan du granskar.");
    }
    if (action.kind === "cancel") setCancelReference(action.reference);
  }
  const cancelOrder = memory.orders.find(
    (order) => order.reference === cancelReference,
  );
  const cartButton = (
    <button
      type="button"
      className="header-cart"
      onClick={() => setView("cart")}
      aria-label={`Visa beställning, ${count} varor`}
    >
      <Icon name="bag" />
      <span>{count}</span>
    </button>
  );
  return (
    <div
      ref={root}
      inert={!hydrated}
      className={`ordering-app${view === "chat" ? " has-chat" : ""}`}
    >
      {view !== "chat" && <StoreHeader>{cartButton}</StoreHeader>}
      <nav className="experience-nav" aria-label="Beställningssätt">
        <button
          type="button"
          aria-pressed={view === "menu"}
          onClick={() => setView("menu")}
        >
          <Icon name="menu" size={18} /> Välj från menyn
        </button>
        <button
          type="button"
          aria-pressed={view === "chat"}
          onClick={() => setView("chat")}
        >
          <Icon name="write" size={18} /> Chatta med oss
        </button>
        <button
          type="button"
          aria-pressed={view === "orders"}
          onClick={() => setView("orders")}
        >
          <Icon name="bag" size={18} /> Mina beställningar
        </button>
        {view === "chat" && cartButton}
      </nav>
      <main id="main-content" className={`experience-layout view-${view}`}>
        <div className="experience-main">
          <div hidden={view !== "chat"}>
            <Chat
              key={sessionKey}
              active={view === "chat"}
              cart={cart}
              orders={memory.orders}
              onApply={applyAction}
              onNavigate={navigate}
              introduction={<StoreHeader />}
            />
          </div>
          <div hidden={view !== "orders"}>
            <SavedOrders
              orders={memory.orders}
              onCancel={setCancelReference}
              onForget={() => setForget(true)}
              onMenu={() => setView("menu")}
            />
          </div>
          <div hidden={view === "chat" || view === "orders"}>
            <OrderingHours />
            <section className="menu-hero">
              <div className="hero-copy">
                <span className="eyebrow">Gulo Gulo Deli</span>
                <h1>
                  Bra korv.
                  <br />
                  <em>På ditt sätt.</em>
                </h1>
                <p>
                  Handgjord korv i mjukt tunnbröd.
                  <br />
                  Välj, justera och gör den till din.
                </p>
                <span className="hero-label">
                  HANTVERK I VARJE WRAP <span>↗</span>
                </span>
              </div>
              <div className="hero-photo">
                <Image
                  src="/wrap-oppen.jpg"
                  alt="Korvwrap i tunnbröd med surkål, gurka och picklad rödlök"
                  fill
                  preload
                  sizes="(max-width: 600px) 180px, 340px"
                />
              </div>
            </section>
            <ProductMenu onChoose={setProduct} />
          </div>
        </div>
        <aside className="cart-pane" aria-label="Beställningsöversikt">
          <OrderSummary
            cart={cart}
            onQuantity={changeQuantity}
            onRemove={(key) => {
              updateMemory((current) => ({
                ...current,
                cart: removeLine(current.cart, key),
              }));
              setNotice("Varan är borttagen.");
              setError("");
            }}
            onReview={() => setReviewCart(cart)}
            onBrowse={() => setView("menu")}
          />
        </aside>
      </main>
      {memoryError && (
        <div className="memory-error" role="alert">
          {memoryError}
          <button
            type="button"
            className="text-button"
            onClick={() => setForget(true)}
          >
            Rensa lokalt minne
          </button>
        </div>
      )}
      <div className="status-announcement" role="status">
        {notice}
      </div>
      {error && (
        <div className="error-toast" role="alert">
          {error}
          <button
            type="button"
            aria-label="Stäng felmeddelande"
            onClick={() => setError("")}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      )}
      <footer className="site-footer">
        <span>GULO GULO DELI</span>
        <p>En provversion av ett enklare sätt att beställa.</p>
        <span>
          {demoMenu.filter((item) => item.category === "wrap").length} SORTER.
          DIN FAVORIT.
        </span>
      </footer>
      <div className="mobile-dock">
        <button
          type="button"
          className="dock-write"
          aria-label="Chatta med oss"
          onClick={() => setView("chat")}
        >
          <Icon name="write" />
        </button>
        <button
          type="button"
          className="dock-cart"
          onClick={() => setView("cart")}
        >
          <span className="dock-count">{count}</span>
          <span>Visa beställning</span>
          <strong>{formatPrice(cartTotalOre(cart))}</strong>
          <Icon name="arrow" size={18} />
        </button>
      </div>
      <SheetPresence>
        {product && (
          <ConfigureProduct
            key={product.id}
            product={product}
            onClose={() => setProduct(null)}
            onAdd={add}
          />
        )}
      </SheetPresence>
      <SheetPresence>
        {reviewCart && (
          <ReviewOrder
            cart={reviewCart}
            currentCart={cart}
            storageError={memoryError}
            ready={ready}
            onClose={() => setReviewCart(null)}
            onSave={() => {
              updateMemory((current) => {
                if (
                  cartFingerprint(current.cart) !== cartFingerprint(reviewCart)
                )
                  throw new Error("Varukorgen har ändrats. Granska den igen.");
                return saveDemoOrder(
                  current,
                  crypto.randomUUID(),
                  new Date().toISOString(),
                );
              }, true);
              setReviewCart(null);
              setView("orders");
              setNotice("Demobeställningen är sparad på enheten.");
              setError("");
            }}
          />
        )}
      </SheetPresence>
      <SheetPresence>
        {cancelReference ? (
          <CancelOrder
            order={cancelOrder}
            onClose={() => setCancelReference(null)}
            onConfirm={() => {
              updateMemory(
                (current) => cancelDemoOrder(current, cancelReference),
                true,
              );
              setCancelReference(null);
              setNotice("Demobeställningen är avbokad.");
              setError("");
            }}
          />
        ) : null}
      </SheetPresence>
      <SheetPresence>
        {forget && (
          <ForgetMemory
            onClose={() => setForget(false)}
            onConfirm={() => {
              forgetMemory();
              setSessionKey((key) => key + 1);
              setForget(false);
              setNotice("Det lokala minnet är rensat.");
              setError("");
            }}
          />
        )}
      </SheetPresence>
    </div>
  );
}
