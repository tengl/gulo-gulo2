import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { OpenToday } from "@/modules/business-hours/ui";
import { businessJsonLd, ORDERING_IS_DEMO } from "@/modules/site";
import { JsonLd, Prose } from "@/modules/site/ui";
import { Icon } from "@/shared/Icon";
import { loadSite } from "@/server/content/load";
import { siteUrl } from "@/server/site/config";

export function generateMetadata(): Metadata {
  const { start } = loadSite().pages;
  return {
    title: { absolute: start.data.titel },
    description: start.data.beskrivning,
    alternates: { canonical: "/" },
  };
}

export default function HomePage() {
  const content = loadSite();
  const { start } = content.pages;
  return (
    <>
      <JsonLd data={businessJsonLd(content, siteUrl())} />
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="eyebrow">Gulo Gulo Deli · Ljusdal</span>
          <h1>{start.data.rubrik}</h1>
          <p className="lead">{start.data.ingress}</p>
          <div className="home-actions">
            <Link href="/bestall" className="primary-button home-order">
              <span>Beställ till hämtning</span>
              <Icon name="arrow" size={18} />
            </Link>
            <Link href="/meny" className="secondary-link">
              Se menyn och priserna
            </Link>
          </div>
          {ORDERING_IS_DEMO && (
            <p className="demo-note">
              <span className="tiny-dot" /> Beställningen på webben är en
              provversion. Ingen riktig order skickas ännu.
            </p>
          )}
        </div>
        <div className="home-hero-photo">
          <Image
            src="/wrap-oppen.jpg"
            alt="Korvwrap i tunnbröd med surkål, gurka och picklad rödlök"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 480px"
          />
        </div>
      </section>
      <OpenToday />
      <section className="home-cards" aria-label="Mer från Gulo Gulo">
        <Link href="/produkter" className="home-card">
          <span className="eyebrow">Charkuteriet</span>
          <strong>Produkter</strong>
          <span>Isterband, Brewurst, salsiccia och mer – två SM-guld.</span>
        </Link>
        <Link href="/event" className="home-card">
          <span className="eyebrow">Catering</span>
          <strong>Event</strong>
          <span>Tält, grill och streetfood på svenskt kött hos er.</span>
        </Link>
        <a href={content.settings.karta} className="home-card" rel="noopener">
          <span className="eyebrow">Hitta hit</span>
          <strong>{content.settings.adress.gata}</strong>
          <span>{content.settings.adress.hitta}</span>
        </a>
      </section>
      <section className="home-more">
        <Prose markdown={start.body} />
      </section>
    </>
  );
}
