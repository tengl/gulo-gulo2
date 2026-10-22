import { cookies } from "next/headers";
import { AdminLogin } from "@/modules/access/ui/AdminLogin";
import { AdminApp } from "@/modules/staff/ui/AdminApp";
import {
  configuredCode,
  validSession,
  sessionCookie,
} from "@/server/access/session";
import { stockholmDate } from "@/modules/business-hours";
import "./admin.css";

export const metadata = {
  title: "Administration · Gulo Gulo",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const code = configuredCode();
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!validSession(token, code))
    return <AdminLogin configured={Boolean(code)} />;
  return <AdminApp today={stockholmDate()} />;
}
