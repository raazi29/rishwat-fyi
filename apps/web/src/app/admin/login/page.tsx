import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { readSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  // Already signed in? Skip the form.
  const session = await readSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="font-serif text-h2 font-bold tracking-tight text-official">Rishwat.fyi</span>
          <p className="mt-1 text-label text-ink-muted">Moderation console</p>
        </div>

        <div className="rounded-lg border border-line bg-surface p-6">
          <h1 className="font-serif text-h1 font-bold text-ink">Sign in</h1>
          <p className="mt-1 text-body text-ink-secondary">
            For moderators and admins. Access is granted by the platform team.
          </p>
          <div className="mt-5">
            <LoginForm />
          </div>
        </div>

        <p className="mt-4 text-center text-label text-ink-muted">
          Sessions last 12 hours. You will be asked to sign in again after that.
        </p>
      </div>
    </div>
  );
}
