import Image from "next/image";
import type { ReactNode } from "react";
import { HoursOverview } from "@/modules/business-hours/ui/HoursOverview";

// OPPEN-016: the chat renders this inside its scroll area, other views above it.
export function StoreHeader({ children }: { children?: ReactNode }) {
  return (
    <>
      <div className="demo-banner">
        <span className="tiny-dot" />
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
            width={56}
            height={56}
            loading="eager"
          />
        </a>
        <HoursOverview />
        {children}
      </header>
    </>
  );
}
