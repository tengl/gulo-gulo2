"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductMenu } from "@/modules/catalog/ui/ProductMenu";
import { demoMenu, formatPrice } from "@/modules/catalog";
import type { Product } from "@/modules/catalog";
import {
  addSelections,
  setQuantity,
  removeLine,
  cartCount,
  cartTotalOre,
} from "@/modules/ordering";
import type { Cart, Selection } from "@/modules/ordering";
import { OrderSummary } from "@/modules/ordering/ui/OrderSummary";
import { Icon } from "@/shared/Icon";
import { Sheet } from "@/shared/Sheet";
import { ConfigureProduct } from "./ConfigureProduct";
import { WriteOrder } from "./WriteOrder";

export function OrderingExperience() {
  const [view, setView] = useState<"menu" | "write" | "cart">("menu");
  const [cart, setCart] = useState<Cart>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [review, setReview] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const count = cartCount(cart);
  function add(items: Selection[]): boolean {
    try {
      setCart(addSelections(cart, items));
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
      setCart(setQuantity(cart, key, quantity));
      setError("");
      setNotice("Antalet är uppdaterat.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Kunde inte ändra antalet.",
      );
    }
  }
  return (
    <div className="ordering-app">
      <div className="demo-banner">
        <span className="tiny-dot" />
        <strong>Prova vår nya beställning</strong>
        <span>Demoläge · Ingen riktig order skickas</span>
      </div>
      <header className="site-header">
        <a
          href="#main-content"
          className="brand"
          aria-label="Gulo Gulo Deli, till beställningen"
        >
          <Image
            src="/logo-light.png"
            alt="Gulo Gulo Deli"
            width={88}
            height={88}
            loading="eager"
          />
          <span>
            HANTVERKSDELI
            <br />
            <small>LJUSDAL</small>
          </span>
        </a>
        <span className="header-note">
          Gjord med omsorg.
          <br />
          <strong>Beställd på ditt sätt.</strong>
        </span>
        <button
          type="button"
          className="header-cart"
          onClick={() => setView("cart")}
          aria-label={`Visa beställning, ${count} varor`}
        >
          <Icon name="bag" />
          <span>{count}</span>
        </button>
      </header>
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
          aria-pressed={view === "write"}
          onClick={() => setView("write")}
        >
          <Icon name="write" size={18} /> Skriv din beställning
        </button>
        <span>En meny. Ditt sätt att beställa.</span>
      </nav>
      <main id="main-content" className={`experience-layout view-${view}`}>
        <div className="experience-main">
          <div hidden={view !== "write"}>
            <WriteOrder
              onAdd={add}
              onMenu={() => setView("menu")}
              onCart={() => setView("cart")}
            />
          </div>
          <div hidden={view === "write"}>
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
              setCart(removeLine(cart, key));
              setNotice("Varan är borttagen.");
              setError("");
            }}
            onReview={() => setReview(true)}
            onBrowse={() => setView("menu")}
          />
        </aside>
      </main>
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
          aria-label="Skriv din beställning"
          onClick={() => setView("write")}
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
      {product && (
        <ConfigureProduct
          key={product.id}
          product={product}
          onClose={() => setProduct(null)}
          onAdd={add}
        />
      )}
      {review && (
        <Sheet
          title="Granska din demobeställning"
          onClose={() => setReview(false)}
        >
          <span className="eyebrow">Allt på ett ställe</span>
          <h2 className="sheet-title review-title">Ser det gott ut?</h2>
          <p className="sheet-description">
            Här är dina val. Det här är en demo, så ingen beställning skickas
            och ingen betalning görs.
          </p>
          <OrderSummary cart={cart} />
          <button
            type="button"
            className="primary-button"
            onClick={() => setReview(false)}
          >
            Fortsätt prova <Icon name="check" />
          </button>
        </Sheet>
      )}
    </div>
  );
}
