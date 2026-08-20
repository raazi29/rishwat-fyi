import { Skeleton } from "@/components/ui";

/** Table skeleton: a header band and a set of row bands inside a bordered shell. */
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <Skeleton className="h-11 w-full rounded-none" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="mt-px h-14 w-full rounded-none" />
      ))}
    </div>
  );
}

/** Loading state for the admin dashboard while stats, duplicates and clusters resolve. */
export default function AdminDashboardLoading() {
  return (
    <div aria-busy="true">
      {/* Faux console top bar so the layout does not jump when the page arrives. */}
      <div className="border-b border-line bg-paper">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] space-y-8 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <Skeleton className="h-9 w-48" />
        <div className="rounded-lg border border-line bg-sunken p-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Skeleton className="h-7 w-44" />
          <TableSkeleton rows={4} />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-7 w-48" />
          <TableSkeleton rows={4} />
        </div>
      </div>
    </div>
  );
}
