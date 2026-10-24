import type { Metadata } from "next";
import { ContentPage } from "@/modules/site/ui";
import { loadSite } from "@/server/content/load";

export function generateMetadata(): Metadata {
  const { data } = loadSite().pages.swish;
  return {
    title: data.titel,
    description: data.beskrivning,
    alternates: { canonical: "/swish" },
  };
}

export default function Page() {
  return <ContentPage page={loadSite().pages.swish} eyebrow="Swish-butiken" />;
}
