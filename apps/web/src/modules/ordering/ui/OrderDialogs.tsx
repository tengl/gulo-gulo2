"use client";

import { useState } from "react";
import { cartFingerprint, canCancelDemoOrder } from "../index";
import type { Cart, SavedOrder } from "../index";
import { Sheet } from "@/shared/Sheet";
import { Icon } from "@/shared/Icon";
import { OrderSummary } from "./OrderSummary";
import { SavedOrderDetails } from "./SavedOrders";

export function ReviewOrder({
  cart,
  currentCart,
  storageError,
  ready,
  onSave,
  onClose,
}: {
  cart: Cart;
  currentCart: Cart;
  storageError: string;
  ready: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const [error, setError] = useState("");
  const stale = cartFingerprint(cart) !== cartFingerprint(currentCart);
  return (
    <Sheet title="Granska din demobeställning" onClose={onClose}>
      <span className="eyebrow">Allt på ett ställe</span>
      <h2 className="sheet-title review-title">Ser det gott ut?</h2>
      <p className="sheet-description">
        Här är dina val. Det här är en demo, så ingen beställning skickas och
        ingen betalning görs.
      </p>
      <OrderSummary cart={cart} />
      <p className="review-memory-note">
        Du kan spara den här demobeställningen på enheten och prova att avboka
        den. Inga kontaktuppgifter behövs. Riktiga beställningar kan avbokas
        före betalning; därefter kontaktar du personalen.
      </p>
      {stale && (
        <p role="alert" className="inline-error">
          Dina val har ändrats. Stäng och granska den nya varukorgen.
        </p>
      )}
      {(error || storageError) && (
        <p role="alert" className="inline-error">
          {error || storageError}
        </p>
      )}
      <button
        type="button"
        className="primary-button"
        disabled={!ready || stale || Boolean(storageError)}
        onClick={() => {
          try {
            onSave();
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Kunde inte spara demobeställningen.",
            );
          }
        }}
      >
        Spara demobeställning <Icon name="check" />
      </button>
      <button type="button" className="text-button" onClick={onClose}>
        Fortsätt prova <Icon name="arrow" />
      </button>
    </Sheet>
  );
}

export function CancelOrder({
  order,
  onConfirm,
  onClose,
}: {
  order?: SavedOrder;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [error, setError] = useState("");
  return (
    <Sheet title="Bekräfta avbokning" onClose={onClose}>
      <h2 className="sheet-title">Avboka demobeställningen?</h2>
      {order ? (
        <>
          <SavedOrderDetails order={order} />
          <p className="sheet-description">
            Det här gäller en lokal demobeställning. Ingen betalning eller
            återbetalning görs. Riktiga beställningar kan avbokas före
            betalning; efter betalning kontaktar du personalen.
          </p>
          <button
            type="button"
            className="primary-button"
            disabled={!canCancelDemoOrder(order)}
            onClick={() => {
              try {
                onConfirm();
              } catch (cause) {
                setError(
                  cause instanceof Error ? cause.message : "Kunde inte avboka.",
                );
              }
            }}
          >
            {order.status === "cancelled"
              ? "Redan avbokad"
              : canCancelDemoOrder(order)
                ? "Ja, avboka demobeställningen"
                : "Kan inte avbokas här"}
          </button>
        </>
      ) : (
        <p>Beställningen finns inte längre i det lokala minnet.</p>
      )}
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      <button type="button" className="text-button" onClick={onClose}>
        Behåll beställningen
      </button>
    </Sheet>
  );
}

export function ForgetMemory({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [error, setError] = useState("");
  return (
    <Sheet title="Rensa lokalt minne" onClose={onClose}>
      <h2 className="sheet-title">Glöm den här enhetens val?</h2>
      <p className="sheet-description">
        Det tar bort varukorgen, samtalet och de lokala demobeställningarna från
        den här enheten. Att rensa minnet avbokar inga riktiga beställningar.
      </p>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      <button
        type="button"
        className="primary-button"
        onClick={() => {
          try {
            onConfirm();
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Kunde inte rensa minnet.",
            );
          }
        }}
      >
        Ja, rensa lokalt minne
      </button>
      <button type="button" className="text-button" onClick={onClose}>
        Behåll minnet
      </button>
    </Sheet>
  );
}
