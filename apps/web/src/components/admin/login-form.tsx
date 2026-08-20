"use client";

import { useActionState } from "react";

import { Button, Field, TextInput } from "@/components/ui";
import { AlertIcon } from "@/components/icons";
import { loginAction } from "@/lib/auth/login-action";

/**
 * The login form. The server action owns validation and cookie handling; this
 * leaf only collects the two fields and shows the returned error. The error
 * pairs red with an icon and a message (never colour alone) — the sanctioned
 * use of the reported channel for a form error (DESIGN.md §Colors rule 1).
 */
export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div role="alert" aria-live="assertive">
        {state.error ? (
          <p className="flex items-start gap-2 rounded-md bg-reported-tint p-3 text-label text-reported">
            <AlertIcon size={18} className="mt-px shrink-0" />
            <span>{state.error}</span>
          </p>
        ) : null}
      </div>

      <Field label="Email" htmlFor="admin-email">
        {(control) => (
          <TextInput
            {...control}
            type="email"
            name="email"
            autoComplete="email"
            autoFocus
            placeholder="you@rishwat.fyi"
          />
        )}
      </Field>

      <Field label="Password" htmlFor="admin-password">
        {(control) => (
          <TextInput {...control} type="password" name="password" autoComplete="current-password" />
        )}
      </Field>

      <Button type="submit" block loading={pending} loadingLabel={"Signing in\u2026"}>
        Sign in
      </Button>
    </form>
  );
}
