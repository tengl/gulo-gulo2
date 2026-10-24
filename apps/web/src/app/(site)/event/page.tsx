import type { Metadata } from "next";
import { ContentPage } from "@/modules/site/ui";
import { loadSite } from "@/server/content/load";

export function generateMetadata(): Metadata {
  const { data } = loadSite().pages.event;
  return {
    title: data.titel,
    description: data.beskrivning,
    alternates: { canonical: "/event" },
  };
}

export default function Page() {
  const { pages, settings } = loadSite();
  return (
    <ContentPage page={pages.event} eyebrow="Catering">
      <aside className="page-contact" aria-label="Boka event">
        <strong>Hör av er så pratar vi upplägg</strong>
        <a href={`tel:${settings.telefon}`} className="primary-button">
          <span>Ring {settings.telefonText}</span>
        </a>
      </aside>
    </ContentPage>
  );
}
