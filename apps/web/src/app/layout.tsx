import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gulo Gulo",
  description: "Gulo Gulos nya beställningstjänst.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="sv"><body>{children}</body></html>;
}
