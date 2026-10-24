import Link from "next/link";
import type { SiteSettings } from "../index";
import { hoursText } from "../index";
import { NewsletterForm } from "./NewsletterForm";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="site-bottom">
      <div className="site-bottom-grid">
        <section aria-labelledby="footer-visit">
          <h2 id="footer-visit">Hitta hit</h2>
          <address>
            {settings.adress.gata}
            <br />
            {settings.adress.postnummer} {settings.adress.ort}
          </address>
          <p>{settings.adress.hitta}</p>
          <a href={settings.karta} rel="noopener">
            Öppna i Google Maps
          </a>
        </section>
        <section aria-labelledby="footer-contact">
          <h2 id="footer-contact">Kontakt</h2>
          <p>
            <a href={`tel:${settings.telefon}`}>{settings.telefonText}</a>
          </p>
          <p>Öppet {hoursText()}</p>
          <ul className="site-bottom-links">
            <li>
              <a href={settings.instagram} rel="noopener">
                Instagram
              </a>
            </li>
            <li>
              <a href={settings.facebook} rel="noopener">
                Facebook
              </a>
            </li>
            <li>
              <a href={settings.shop} rel="noopener">
                Webbshop: keps och presentkort
              </a>
            </li>
            <li>
              <Link href="/swish">Handla när vi har stängt</Link>
            </li>
          </ul>
        </section>
        <section aria-labelledby="footer-news">
          <h2 id="footer-news">Nyhetsbrevet</h2>
          <p>Det senaste från charkuteriet och delin, när något händer.</p>
          <NewsletterForm />
        </section>
      </div>
      <p className="site-bottom-legal">
        © Gulo Gulo · <Link href="/integritet">Integritet</Link>
      </p>
    </footer>
  );
}
