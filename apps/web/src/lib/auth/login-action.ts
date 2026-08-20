"use server";

import { redirect } from "next/navigation";

import { adminLogin } from "@/lib/api";

import { setSessionCookie } from "./session";

export interface LoginState {
  error: string | null;
}

/**
 * Server action for `POST /admin/auth/login`. On success it stores the JWT in
 * an httpOnly cookie and redirects to the dashboard. It never reveals whether
 * an email exists: a wrong password and an unknown email both surface the same
 * generic copy, matching the API's deliberate no-enumeration behaviour.
 */
export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (email.length === 0 || password.length === 0) {
    return { error: "Enter your email and password to sign in." };
  }

  const result = await adminLogin(email, password);
  if (!result.ok) {
    switch (result.error.code) {
      case "unauthorized":
        // Deliberately generic — no user enumeration, matching the API.
        return { error: "Those credentials did not work." };
      case "too_many_requests":
        return {
          error:
            "Too many sign-in attempts from this connection. Please wait a little while before trying again.",
        };
      case "bad_request":
        return { error: "Enter a valid email address and a password of at least 8 characters." };
      case "timeout":
      case "network_error":
        return { error: "We couldn\u2019t reach the sign-in service. Please try again in a moment." };
      default:
        return { error: result.error.message || "Sign-in failed. Please try again." };
    }
  }

  await setSessionCookie(result.data.token);
  redirect("/admin");
}
