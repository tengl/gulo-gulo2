import type { Metadata } from "next";
import { ContentPage } from "@/modules/site/ui";
import { loadSite } from "@/server/content/load";

export function generateMetadata(): Metadata {
  const { data } = loadSite().pages.integritet;
  return {
    title: data.titel,
    description: data.beskrivning,
    alternates: { canonical: "/integritet" },
  };
}

export default function Page() {
  return <ContentPage page={loadSite().pages.integritet} eyebrow="Gulo Gulo" />;
}
