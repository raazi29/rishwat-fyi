import Link from "next/link";
import type { ReactNode } from "react";

import { Badge, Button } from "@/components/ui";
import { signOutAction } from "@/lib/auth/logout-action";
import type { AdminSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

/**
 * The moderation-console chrome: a compact top bar with the wordmark, the two
 * admin links (Dashboard / Queue), the signed-in identity and role, and a
 * sign-out button wired to a server action. No marketing navigation — this is
 * a pure Operate surface. Rendered by each authenticated admin page after
 * `requireSession`, so the identity always comes from a verified server read.
 */

type AdminSection = "dashboard" | "queue";

const NAV: Array<{ key: AdminSection; label: string; href: string }> = [
  { key: "dashboard", label: "Dashboard", href: "/admin" },
  { key: "queue", label: "Queue", href: "/admin/queue" },
];

export function AdminShell({
  session,
  active,
  children,
}: {
  session: AdminSession;
  active: AdminSection;
  children: ReactNode;
}) {
  const identity = session.email ?? session.name ?? session.subject ?? "Signed in";

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-paper">
        <div className="mx-auto flex min-h-16 max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="font-serif text-h3 font-bold leading-none tracking-tight text-official">
              Rishwat.fyi
            </span>
            <span aria-hidden="true" className="h-6 w-px bg-line" />
            <span className="text-label font-medium text-ink-muted">Moderation console</span>
          </div>

          <nav aria-label="Admin sections" className="flex items-center gap-1">
            {NAV.map((item) => {
              const current = item.key === active;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-md px-3 text-label font-medium transition-colors duration-150",
                    current
                      ? "bg-sunken text-ink"
                      : "text-ink-secondary hover:bg-sunken hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-2 text-label text-ink-secondary">
              <span className="inline-block max-w-[16ch] truncate align-middle sm:max-w-[26ch]" title={identity}>
                {identity}
              </span>
              <Badge tone={session.role === "admin" ? "official-solid" : "sage"}>
                {session.role === "admin" ? "Admin" : "Moderator"}
              </Badge>
            </span>
            <form action={signOutAction}>
              <Button type="submit" variant="secondary" size="md">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</div>
    </>
  );
}
