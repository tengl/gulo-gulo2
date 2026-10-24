import Image from "next/image";
import type { ReactNode } from "react";
import type { Page } from "../index";
import { Prose } from "./Prose";

export function ContentPage({
  page,
  eyebrow,
  children,
}: {
  page: Page;
  eyebrow: string;
  children?: ReactNode;
}) {
  const { data } = page;
  return (
    <article className="content-page">
      <header className="page-intro">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{data.rubrik}</h1>
        <p className="lead">{data.ingress}</p>
      </header>
      {data.bild && (
        <figure className="page-figure">
          <Image
            src={data.bild}
            alt={data.bildtext ?? ""}
            width={900}
            height={1200}
            sizes="(max-width: 700px) 100vw, 420px"
          />
          {data.bildtext && <figcaption>{data.bildtext}</figcaption>}
        </figure>
      )}
      <Prose markdown={page.body} />
      {children}
    </article>
  );
}
