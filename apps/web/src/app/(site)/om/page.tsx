import type { Metadata } from "next";
import { ContentPage } from "@/modules/site/ui";
import { loadSite } from "@/server/content/load";

export function generateMetadata(): Metadata {
  const { data } = loadSite().pages.om;
  return {
    title: data.titel,
    description: data.beskrivning,
    alternates: { canonical: "/om" },
  };
}

export default function Page() {
  return <ContentPage page={loadSite().pages.om} eyebrow="Gulo Gulo" />;
}
