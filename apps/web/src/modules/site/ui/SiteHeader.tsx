"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/shared/Icon";
import { Sheet, SheetPresence } from "@/shared/Sheet";

const links = [
  { href: "/meny", label: "Meny" },
  { href: "/produkter", label: "Produkter" },
  { href: "/event", label: "Event" },
  { href: "/om", label: "Om oss" },
];

// WEBB-002: logo, a few links and one clear way to order.
export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const current = (href: string) =>
    path === href || path.startsWith(`${href}/`) ? "page" : undefined;
  return (
    <header className="site-top">
      <a className="skip-link" href="#innehall">
        Till innehållet
      </a>
      <Link href="/" className="site-brand" aria-label="Gulo Gulo Deli, startsidan">
        <Image src="/logo-light.png" alt="" width={52} height={52} priority />
      </Link>
      <nav className="site-links" aria-label="Webbplatsen">
        {links.map((link) => (
          <Link key={link.href} href={link.href} aria-current={current(link.href)}>
            {link.label}
          </Link>
        ))}
      </nav>
      <Link href="/bestall" className="site-order">
        Beställ <Icon name="arrow" size={16} />
      </Link>
      <button
        type="button"
        className="site-menu-button"
        aria-label="Öppna menyn"
        onClick={() => setOpen(true)}
      >
        <Icon name="menu" />
      </button>
      <SheetPresence>
        {open && (
          <Sheet title="Webbplatsens meny" onClose={() => setOpen(false)}>
            <nav className="site-sheet-links" aria-label="Webbplatsen">
              <Link href="/" onClick={() => setOpen(false)}>
                Start
              </Link>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={current(link.href)}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/swish" onClick={() => setOpen(false)}>
                Handla när vi har stängt
              </Link>
            </nav>
            <Link
              href="/bestall"
              className="primary-button"
              onClick={() => setOpen(false)}
            >
              <span>Beställ till hämtning</span>
              <Icon name="arrow" size={18} />
            </Link>
          </Sheet>
        )}
      </SheetPresence>
    </header>
  );
}
