"use client";

import { useState } from "react";
import {
  canChangeDemoOrderStatus,
  canChangeDemoOrderPreparation,
  demoOrderFingerprint,
  demoOrderStatusLabels,
  type SavedOrder,
} from "@/modules/ordering";
import { SavedOrderDetails } from "@/modules/ordering/ui";
import { Sheet } from "@/shared/Sheet";

const actions = {
  confirmed: {
    label: "Bekräfta mottagning",
    explanation:
      "Kunden ser att mottagningen har bekräftats. Det här är en lokal demobekräftelse.",
    success: "Mottagningen är bekräftad",
  },
  preparing: {
    label: "Påbörja tillagning",
    explanation:
      "Kunden ser att beställningen tillagas. Det här är en lokal demomarkering.",
    success: "Demobeställningen tillagas",
  },
  prepared: {
    label: "Markera som tillagad",
    explanation:
      "Kunden ser att beställningen är tillagad. Det här är en lokal demomarkering.",
    success: "Demobeställningen är markerad som tillagad",
  },
  paid: {
    label: "Markera som betald",
    explanation:
      "Det här simulerar betalningsstatus. Ingen Swish-betalning tas emot eller verifieras. Kunden kan därefter inte avboka i demon.",
    success: "Demobeställningen är markerad som betald",
  },
  collected: {
    label: "Markera som hämtad",
    explanation:
      "Det här simulerar hämtad status. Ingen riktig utlämning registreras.",
    success: "Demobeställningen är markerad som hämtad",
  },
  cancelled: {
    label: "Avboka demobeställning",
    explanation:
      "Endast den här obetalda demobeställningen avbokas. Ingen betalning eller återbetalning görs.",
    success: "Demobeställningen är avbokad",
  },
} as const;
export type AdminOrderTarget = keyof typeof actions;

export function OrderAdminDetails({
  order,
  storageError,
  onChange,
  onClose,
}: {
  order: SavedOrder | undefined;
  storageError: string;
  onChange: (
    reference: string,
    expected: string,
    target: AdminOrderTarget,
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [confirmation, setConfirmation] = useState<{
    order: SavedOrder;
    target: AdminOrderTarget;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const stale = Boolean(
    confirmation &&
    (!order ||
      demoOrderFingerprint(order) !== demoOrderFingerprint(confirmation.order)),
  );
  async function confirm() {
    if (!confirmation || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await onChange(
        confirmation.order.reference,
        demoOrderFingerprint(confirmation.order),
        confirmation.target,
      );
      setNotice(
        `${actions[confirmation.target].success}. Ändringen är sparad lokalt och visas även på kundsidan.`,
      );
      setConfirmation(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Kunde inte spara statusändringen.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet
      title={confirmation ? "Bekräfta statusändring" : "Beställningsdetaljer"}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="admin-scope admin-order-detail">
        <span className="eyebrow">Lokal demobeställning</span>
        <h2>
          {confirmation
            ? actions[confirmation.target].label + "?"
            : "Beställningsdetaljer"}
        </h2>
        {storageError ? (
          <p className="admin-error" role="alert">
            Beställningen kan inte läsas. Ingen status kan ändras.
          </p>
        ) : !order ? (
          <p className="admin-error" role="alert">
            Beställningen finns inte längre i det lokala minnet.
          </p>
        ) : (
          <>
            <p className={`admin-order-status status-${order.status}`}>
              {demoOrderStatusLabels[order.status]}
            </p>
            <SavedOrderDetails order={confirmation?.order ?? order} />
            {confirmation ? (
              <>
                <p className="admin-save-note">
                  {actions[confirmation.target].explanation}
                </p>
                {stale && (
                  <p role="alert" className="admin-error">
                    Beställningen har ändrats. Gå tillbaka och granska den
                    aktuella versionen.
                  </p>
                )}
                <div className="admin-actions">
                  <button
                    className="admin-secondary"
                    disabled={busy}
                    onClick={() => {
                      setConfirmation(null);
                      setError("");
                    }}
                  >
                    Tillbaka
                  </button>
                  <button
                    className="admin-primary"
                    disabled={busy || stale}
                    onClick={confirm}
                  >
                    {busy ? "Sparar…" : "Bekräfta lokal ändring"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="admin-save-note">
                  Välj nästa steg och granska innan du bekräftar. Kunden ser
                  samma lokala status för mottagning, tillagning och betalning.
                </p>
                <div className="admin-order-actions">
                  {(Object.keys(actions) as AdminOrderTarget[])
                    .filter((target) =>
                      target === "confirmed" ||
                      target === "preparing" ||
                      target === "prepared"
                        ? canChangeDemoOrderPreparation(order, target)
                        : canChangeDemoOrderStatus(order.status, target),
                    )
                    .map((target) => (
                      <button
                        className={
                          target === "cancelled"
                            ? "admin-secondary"
                            : "admin-primary"
                        }
                        key={target}
                        onClick={() => {
                          setConfirmation({ order, target });
                          setError("");
                          setNotice("");
                        }}
                      >
                        {actions[target].label}
                      </button>
                    ))}
                </div>
                {(order.status === "collected" ||
                  order.status === "cancelled") && (
                  <p>Beställningen är avslutad.</p>
                )}
              </>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="admin-error">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="admin-success">
            {notice}
          </p>
        )}
      </div>
    </Sheet>
  );
}
