import {
  demoMenu,
  formatPrice,
  DOUBLE_SURCHARGE_ORE,
  siteDeveloper,
} from "../../catalog/index.ts";
import { demoHours } from "../../business-hours/index.ts";
import type { ContentProduct, Page, SiteSettings } from "./content.ts";
import { anchorsIn, plainMarkdown } from "./markdown.ts";

export type SiteContent = {
  settings: SiteSettings;
  pages: Record<"start" | "event" | "om" | "swish" | "integritet", Page>;
  products: ContentProduct[];
};

// Online ordering is a demo until real orders and payment are connected. The
// site and /llms.txt say so, so AI assistants do not promise real orders.
export const ORDERING_IS_DEMO = true;

// WEBB-001: every page of the site; the content check validates links against it.
export function sitePaths(products: readonly ContentProduct[]): string[] {
  return [
    "/",
    "/meny",
    "/produkter",
    ...products.map((product) => `/produkter/${product.slug}`),
    "/event",
    "/om",
    "/swish",
    "/integritet",
    "/bestall",
  ];
}

// Names of the content pages for people, by file name in content/sidor.
export const pageNames: Record<keyof SiteContent["pages"], string> = {
  start: "Startsidan",
  event: "Event",
  om: "Om oss",
  swish: "Swish-butiken",
  integritet: "Integritet",
};

export const pagePath = (slug: string) => (slug === "start" ? "/" : `/${slug}`);

// The anchors on each content page; every page also has the skip link target.
export function pageAnchors(content: SiteContent): Map<string, Set<string>> {
  return new Map(
    Object.entries(content.pages).map(([slug, page]) => [
      pagePath(slug),
      new Set(["innehall", ...anchorsIn(page.body).map((anchor) => anchor.id)]),
    ]),
  );
}

export type LinkTarget = { href: string; label: string; group: string };

// WEBB-016: the pages and places admin offers when a link is inserted.
export function linkTargets(content: SiteContent): LinkTarget[] {
  const pages = Object.entries(content.pages) as [keyof SiteContent["pages"], Page][];
  return [
    ...pages.flatMap(([slug, page]) => [
      { href: pagePath(slug), label: pageNames[slug], group: "Sidor" },
      ...anchorsIn(page.body).map((anchor) => ({
        href: `${pagePath(slug)}#${anchor.id}`,
        label: `${pageNames[slug]} › ${anchor.title}`,
        group: "Sidor",
      })),
    ]),
    { href: "/meny", label: "Menyn med priser", group: "Sidor" },
    { href: "/bestall", label: "Beställ (chatten och menyn)", group: "Sidor" },
    { href: "/produkter", label: "Alla produkter", group: "Produkter" },
    ...content.products.map((product) => ({
      href: `/produkter/${product.slug}`,
      label: product.data.namn,
      group: "Produkter",
    })),
  ];
}

export function menuSections() {
  const line = (product: (typeof demoMenu)[number]) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    badge: product.badge,
    price: formatPrice(product.priceOre),
    doublePrice:
      product.category === "wrap"
        ? formatPrice(product.priceOre + DOUBLE_SURCHARGE_ORE)
        : undefined,
  });
  return {
    wraps: demoMenu.filter((item) => item.category === "wrap").map(line),
    drinks: demoMenu.filter((item) => item.category === "drink").map(line),
  };
}

const schemaDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function hoursText(): string {
  return `${demoHours.days} ${demoHours.opening.from}–${demoHours.opening.until}`;
}

// WEBB-010: schema.org data from the same sources as the pages.
export function businessJsonLd(content: SiteContent, base: URL) {
  const { settings } = content;
  return {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    "@id": new URL("/#verksamhet", base).href,
    name: settings.namn,
    description: settings.beskrivning,
    url: new URL("/", base).href,
    telephone: settings.telefon,
    servesCuisine: ["Korv", "Charkuterier", "Streetfood"],
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.adress.gata,
      postalCode: settings.adress.postnummer,
      addressLocality: settings.adress.ort,
      addressCountry: "SE",
    },
    hasMap: settings.karta,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: demoHours.weekdays.map((day) => schemaDays[day]),
        opens: demoHours.opening.from,
        closes: demoHours.opening.until,
      },
    ],
    hasMenu: new URL("/meny", base).href,
    sameAs: [settings.instagram, settings.facebook],
  };
}

export function menuJsonLd(base: URL) {
  const { wraps, drinks } = menuSections();
  const offer = (price: string) => ({
    "@type": "Offer",
    price: price.replace(/[^\d,]/g, "").replace(",", "."),
    priceCurrency: "SEK",
  });
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: "Meny",
    url: new URL("/meny", base).href,
    hasMenuSection: [
      {
        "@type": "MenuSection",
        name: "Korvwraps",
        hasMenuItem: wraps.map((item) => ({
          "@type": "MenuItem",
          name: item.name,
          description: `${item.description} Enkel ${item.price}, dubbel ${item.doublePrice}.`,
          offers: [offer(item.price), offer(item.doublePrice!)],
        })),
      },
      {
        "@type": "MenuSection",
        name: "Dryck",
        hasMenuItem: drinks.map((item) => ({
          "@type": "MenuItem",
          name: item.name,
          offers: offer(item.price),
        })),
      },
    ],
  };
}

export function productJsonLd(product: ContentProduct, base: URL) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.data.namn,
    description: product.data.slogan,
    url: new URL(`/produkter/${product.slug}`, base).href,
    ...(product.data.bild
      ? { image: new URL(product.data.bild, base).href }
      : {}),
    ...(product.data.utmarkelse ? { award: product.data.utmarkelse } : {}),
    brand: { "@type": "Brand", name: "Gulo Gulo Charcuterie" },
    additionalProperty: product.data.fakta.map((fact) => ({
      "@type": "PropertyValue",
      name: fact.rubrik,
      value: fact.varden.join(", "),
    })),
  };
}

function orderLinkHelp(base: URL): string {
  const { wraps, drinks } = menuSections();
  return [
    "## Beställningslänk",
    "",
    `En länk som ${new URL("/bestall?varor=ghostdog-dubbel:2,loka:1", base).href} öppnar beställningen med valen som ett förslag. Kunden granskar och godkänner själv; inget beställs av länken.`,
    "Format: varor=<kod>:<antal>,<kod>:<antal>. Korvwraps får -enkel eller -dubbel efter koden; utan variant får kunden välja.",
    ...(ORDERING_IS_DEMO
      ? [
          "Obs: beställningen på webben är i dag en demo. Ingen riktig order skickas till köket och inget betalas.",
        ]
      : []),
    "",
    `Korvwraps: ${wraps.map((item) => `${item.id} (${item.name})`).join(", ")}.`,
    `Dryck: ${drinks.map((item) => `${item.id} (${item.name})`).join(", ")}.`,
  ].join("\n");
}

// WEBB-010: /llms.txt, a short overview for AI assistants.
export function llmsText(content: SiteContent, base: URL): string {
  const { settings, pages, products } = content;
  const link = (path: string) => new URL(path, base).href;
  return `# ${settings.namn}

> ${settings.beskrivning}

- Adress: ${settings.adress.gata}, ${settings.adress.postnummer} ${settings.adress.ort}. ${settings.adress.hitta}
- Öppettider: ${hoursText()}. Köket stänger 30 minuter före. Tider runt helgdagar kan avvika.
- Telefon: ${settings.telefonText}

## Sidor

- [Meny med priser](${link("/meny")}): korvwraps i tunnbröd och dryck.
- [Produkter från charkuteriet](${link("/produkter")}): ${products.map((product) => product.data.namn).join(", ")}.
- [${pages.event.data.titel}](${link("/event")}): ${pages.event.data.beskrivning}
- [${pages.om.data.titel}](${link("/om")}): ${pages.om.data.beskrivning}
- [${pages.swish.data.titel}](${link("/swish")}): ${pages.swish.data.beskrivning}
- [Beställ](${link("/bestall")})${ORDERING_IS_DEMO ? " (demo)" : ""}
- [All text som Markdown](${link("/llms-full.txt")})

${orderLinkHelp(base)}

## Om webbplatsen

Webbplatsen och beställningstjänsten är utvecklade av ${siteDeveloper.name} ([LinkedIn](${siteDeveloper.url})).
`;
}

// WEBB-010: /llms-full.txt, all site text in one Markdown document.
export function llmsFullText(content: SiteContent, base: URL): string {
  const { pages, products } = content;
  const { wraps, drinks } = menuSections();
  const page = (item: Page, path: string) =>
    `# ${item.data.rubrik}\n\nKälla: ${new URL(path, base).href}\n\n${item.data.ingress}\n\n${plainMarkdown(item.body)}`;
  const menu = [
    "# Meny",
    "",
    `Källa: ${new URL("/meny", base).href}`,
    "",
    "## Korvwraps",
    "",
    ...wraps.map(
      (item) =>
        `- ${item.name}: ${item.description} Enkel ${item.price}, dubbel ${item.doublePrice}.`,
    ),
    "",
    "## Dryck",
    "",
    ...drinks.map((item) => `- ${item.name}: ${item.price}`),
  ].join("\n");
  const productText = products.map((product) =>
    [
      `## ${product.data.namn}`,
      "",
      `Källa: ${new URL(`/produkter/${product.slug}`, base).href}`,
      "",
      `”${product.data.slogan}”.${product.data.utmarkelse ? ` ${product.data.utmarkelse}.` : ""}`,
      "",
      ...product.data.fakta.map(
        (fact) => `- ${fact.rubrik}: ${fact.varden.join(", ")}`,
      ),
      "",
      plainMarkdown(product.body),
    ].join("\n"),
  );
  return [
    llmsText(content, base).trim(),
    page(pages.start, "/"),
    menu,
    `# Produkter från charkuteriet\n\n${productText.join("\n\n")}`,
    page(pages.event, "/event"),
    page(pages.om, "/om"),
    page(pages.swish, "/swish"),
  ].join("\n\n---\n\n") + "\n";
}
