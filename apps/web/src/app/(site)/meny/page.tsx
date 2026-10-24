import Link from "next/link";
import type { Metadata } from "next";
import { menuJsonLd, menuSections, ORDERING_IS_DEMO } from "@/modules/site";
import { JsonLd } from "@/modules/site/ui";
import { Icon } from "@/shared/Icon";
import { siteUrl } from "@/server/site/config";

export const metadata: Metadata = {
  title: "Meny",
  description:
    "Korvwraps i tunnbröd och dryck hos Gulo Gulo Deli i Ljusdal, med priser för enkel och dubbel.",
  alternates: { canonical: "/meny" },
};

// WEBB-009: the menu as plain text, from the same catalogue as the ordering app.
export default function MenuPage() {
  const { wraps, drinks } = menuSections();
  return (
    <article className="content-page menu-page">
      <JsonLd data={menuJsonLd(siteUrl())} />
      <header className="page-intro">
        <span className="eyebrow">Gulo Gulo Deli</span>
        <h1>Meny</h1>
        <p className="lead">
          Handgjord korv i lokalbakat mjukt tunnbröd med picklad gurka, picklad
          rödlök, rostad lök och senap. Välj enkel eller dubbel.
        </p>
      </header>
      <section aria-labelledby="menu-wraps">
        <h2 id="menu-wraps">Korvwraps</h2>
        <ul className="menu-list">
          {wraps.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.name}</strong>
                {item.badge && <span className="menu-badge">{item.badge}</span>}
                <p>{item.description}</p>
              </div>
              <span className="menu-prices">
                <span>Enkel {item.price}</span>
                <span>Dubbel {item.doublePrice}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="menu-drinks">
        <h2 id="menu-drinks">Dryck</h2>
        <ul className="menu-list compact">
          {drinks.map((item) => (
            <li key={item.id}>
              <strong>{item.name}</strong>
              <span className="menu-prices">{item.price}</span>
            </li>
          ))}
        </ul>
      </section>
      <p className="menu-allergy">
        Fråga personalen om allergener. Tunnbröd och rostad lök innehåller
        gluten och senapen innehåller senap.
      </p>
      <Link href="/bestall" className="primary-button page-cta">
        <span>
          Beställ till hämtning{ORDERING_IS_DEMO ? " (provversion)" : ""}
        </span>
        <Icon name="arrow" size={18} />
      </Link>
    </article>
  );
}
