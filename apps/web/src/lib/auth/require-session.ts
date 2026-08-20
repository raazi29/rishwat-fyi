import { redirect } from "next/navigation";

import { readSession, type AdminSession } from "./session";

/**
 * Guard for every authenticated admin page. Reads the session on the server and
 * redirects to the login screen when the token is missing or expired, otherwise
 * returns the decoded session (role / email for the UI). This runs server-side
 * on every admin page render; the API still authorises each data call itself,
 * so this is never the only gate.
 */
export async function requireSession(): Promise<AdminSession> {
  const session = await readSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
