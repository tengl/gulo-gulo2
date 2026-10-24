import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { loadSite } from "@/server/content/load";

export const metadata: Metadata = {
  title: "Produkter",
  description:
    "Korv, salami och burgare från Gulo Gulo Charcuterie i Ljusdal – bland annat SM-guldvinnande isterband och Brewurst.",
  alternates: { canonical: "/produkter" },
};

export default function ProductsPage() {
  const { products } = loadSite();
  return (
    <article className="content-page wide">
      <header className="page-intro">
        <span className="eyebrow">Gulo Gulo Charcuterie</span>
        <h1>Produkter</h1>
        <p className="lead">
          Allt görs av Niklas i charkuteriet vid delin. Produkterna finns i
          butiken; fråga gärna vad som finns i dag.
        </p>
      </header>
      <ul className="product-tiles">
        {products.map((product) => (
          <li key={product.slug}>
            <Link href={`/produkter/${product.slug}`}>
              <div className="product-tile-image">
                {product.data.bild ? (
                  <Image
                    src={product.data.bild}
                    alt=""
                    fill
                    sizes="(max-width: 700px) 50vw, 260px"
                  />
                ) : (
                  <Image src="/logo-light.png" alt="" width={80} height={80} />
                )}
              </div>
              <strong>{product.data.namn}</strong>
              <span>”{product.data.slogan}”</span>
              {product.data.utmarkelse && (
                <span className="menu-badge">SM-guld</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
