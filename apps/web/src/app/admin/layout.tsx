import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Admin surface layout. This segment is excluded from indexing (robots already
 * disallows /admin; this reinforces it in metadata for every nested route).
 *
 * The root layout renders the public header, footer and bottom tab bar for the
 * whole site and cannot be modified from here. This is an authenticated Operate
 * surface with no marketing navigation, so a small scoped stylesheet hides that
 * public chrome whenever the admin console is on the page (keyed on the
 * `#admin-console` marker below). It only affects admin routes and touches no
 * files outside this segment.
 */

export const metadata: Metadata = {
  title: "Moderation console",
  robots: { index: false, follow: false },
};

const HIDE_PUBLIC_CHROME = `
body:has(#admin-console) > header,
body:has(#admin-console) > footer,
body:has(#admin-console) > nav[aria-label="Primary"] { display: none !important; }
body:has(#admin-console) > main { padding-bottom: 0 !important; }
`;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HIDE_PUBLIC_CHROME }} />
      <div id="admin-console" className="min-h-dvh bg-paper">
        {children}
      </div>
    </>
  );
}
