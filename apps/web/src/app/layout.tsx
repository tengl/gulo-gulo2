import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gulo Gulo",
  description: "Gulo Gulos nya beställningstjänst.",
  robots: { index: false, follow: false },
};

// UX-010: safe-area insets need viewport-fit=cover, and Android keyboards should
// shrink the layout so the chat composer stays visible.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="sv"><body>{children}</body></html>;
}
