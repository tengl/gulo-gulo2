import type { ReactNode } from "react";
import "./admin.css";
import "./orders.css";

export const metadata = {
  title: "Administration · Gulo Gulo",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
