"use server";

import { redirect } from "next/navigation";

import { clearSessionCookie } from "./session";

/** Sign out: clear the session cookie and return to the login screen. */
export async function signOutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/admin/login");
}
