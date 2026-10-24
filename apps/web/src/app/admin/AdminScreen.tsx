import { cookies } from "next/headers";
import { AdminLogin } from "@/modules/access/ui";
import { AdminApp, type AdminView } from "@/modules/staff/ui";
import {
  configuredCode,
  validSession,
  sessionCookie,
} from "@/server/access/session";
import { stockholmDate } from "@/modules/business-hours";

// Each page checks access; layouts alone do not recheck sessions on navigation.
export async function AdminScreen({ view }: { view: AdminView }) {
  const code = configuredCode();
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!validSession(token, code))
    return <AdminLogin configured={Boolean(code)} />;
  return <AdminApp today={stockholmDate()} view={view} />;
}
