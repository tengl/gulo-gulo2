import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { productJsonLd } from "@/modules/site";
import { JsonLd, Prose } from "@/modules/site/ui";
import { loadSite } from "@/server/content/load";
import { siteUrl } from "@/server/site/config";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadSite().products.map((product) => ({ slug: product.slug }));
}

function find(slug: string) {
  return loadSite().products.find((product) => product.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = find((await params).slug);
  if (!product) return {};
  return {
    title: product.data.namn,
    description: `${product.data.namn} – ”${product.data.slogan}”. ${product.data.fakta
      .map((fact) => `${fact.rubrik}: ${fact.varden.join(", ")}`)
      .join(". ")}.`.slice(0, 200),
    alternates: { canonical: `/produkter/${product.slug}` },
    ...(product.data.bild ? { openGraph: { images: [product.data.bild] } } : {}),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const product = find((await params).slug);
  if (!product) notFound();
  const { data } = product;
  return (
    <article className="content-page product-page">
      <JsonLd data={productJsonLd(product, siteUrl())} />
      <Link href="/produkter" className="back-link">
        ← Alla produkter
      </Link>
      <header className="page-intro">
        <span className="eyebrow">”{data.slogan}”</span>
        <h1>{data.namn}</h1>
        {data.utmarkelse && <p className="award">{data.utmarkelse}</p>}
      </header>
      <div className="product-layout">
        {data.bild && (
          <figure className="page-figure">
            <Image
              src={data.bild}
              alt={data.bildtext ?? data.namn}
              width={900}
              height={1200}
              sizes="(max-width: 700px) 100vw, 360px"
            />
          </figure>
        )}
        <dl className="product-facts">
          {data.fakta.map((fact) => (
            <div key={fact.rubrik}>
              <dt>{fact.rubrik}</dt>
              <dd>{fact.varden.join(", ")}</dd>
            </div>
          ))}
        </dl>
      </div>
      <Prose markdown={product.body} />
    </article>
  );
}
