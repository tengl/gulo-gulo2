import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/modules/site/ui";
import { loadSite } from "@/server/content/load";

export default function SiteLayout({ children }: { children: ReactNode }) {
  const { settings } = loadSite();
  return (
    <div className="site">
      <SiteHeader />
      <main id="innehall" className="site-main">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
