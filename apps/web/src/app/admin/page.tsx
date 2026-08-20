import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ButtonLink, Callout, SectionHeading } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";
import { getClusters, getDuplicates, getStatsOverview } from "@/lib/api";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminError } from "@/components/admin/admin-error";
import { ClustersTable } from "@/components/admin/clusters-table";
import { DuplicatesTable } from "@/components/admin/duplicates-table";
import { StatsPanels } from "@/components/admin/stats-panels";
import { requireSession } from "@/lib/auth/require-session";

export const metadata: Metadata = { title: "Dashboard" };

/** Queue-only view for a moderator (no admin statistics) — an explanation, not an error. */
function ModeratorHome({ note }: { note?: string }) {
  return (
    <div className="max-w-[68ch]">
      <h1 className="font-serif text-h1 font-bold text-ink">Moderation dashboard</h1>
      <p className="mt-1 text-body text-ink-secondary">Signed in as a moderator.</p>
      <Callout tone="info" className="mt-5" title="Statistics require an admin account">
        {note ??
          "Platform statistics, duplicate groups and coordinated-cluster detection are available to admins. As a moderator you can review reports and apply decisions in the queue."}
      </Callout>
      <div className="mt-5">
        <ButtonLink href="/admin/queue" variant="primary" iconTrailing={<ArrowRightIcon size={18} />}>
          Open the review queue
        </ButtonLink>
      </div>
    </div>
  );
}

/** Admin dashboard content. The API is the authority: a `forbidden` here means the
 * account is not really an admin, so we fall back to the moderator view rather
 * than trusting the decoded role alone. */
async function AdminDashboard({ token }: { token: string }) {
  const [overview, duplicates, clusters] = await Promise.all([
    getStatsOverview(token),
    getDuplicates(token),
    getClusters(token),
  ]);

  if (!overview.ok && overview.error.code === "unauthorized") {
    redirect("/admin/login");
  }
  if (!overview.ok && overview.error.code === "forbidden") {
    return <ModeratorHome />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-h1 font-bold text-ink">Dashboard</h1>
        <p className="mt-1 text-body text-ink-secondary">Live platform statistics and anti-abuse signals.</p>
      </div>

      {overview.ok ? (
        <StatsPanels overview={overview.data} />
      ) : (
        <AdminError error={overview.error} title="Statistics could not be loaded" retryHref="/admin" />
      )}

      <section aria-labelledby="dupes-heading">
        <SectionHeading
          id="dupes-heading"
          description="Reports the system has grouped as likely duplicates of one another."
        >
          Duplicate groups
        </SectionHeading>
        {duplicates.ok ? (
          <DuplicatesTable groups={duplicates.data} />
        ) : (
          <AdminError error={duplicates.error} title="Duplicate groups could not be loaded" />
        )}
      </section>

      <section aria-labelledby="clusters-heading">
        <SectionHeading
          id="clusters-heading"
          description="Coordinated submissions from the same IP-hash bucket for a single service."
        >
          Coordinated clusters
        </SectionHeading>
        {clusters.ok ? (
          <ClustersTable clusters={clusters.data} />
        ) : (
          <AdminError error={clusters.error} title="Clusters could not be loaded" />
        )}
      </section>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const session = await requireSession();

  return (
    <AdminShell session={session} active="dashboard">
      {session.role === "admin" ? <AdminDashboard token={session.token} /> : <ModeratorHome />}
    </AdminShell>
  );
}
