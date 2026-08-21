import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui";

/** Skeleton for /services/[slug] while the detail and aggregates resolve. */
export default function ServiceDetailLoading() {
  return (
    <Container>
      <div className="py-6" aria-busy="true">
        <Skeleton className="h-4 w-72" />
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <Skeleton className="h-9 w-full max-w-64" />
            <Skeleton className="h-5 w-full max-w-56" />
            <Skeleton className="h-4 w-full max-w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-11 w-20" />
            <Skeleton className="h-11 w-20" />
          </div>
        </div>
      </div>

      <Skeleton className="h-10 w-full max-w-lg" />

      <div className="grid gap-6 py-8 min-[768px]:grid-cols-2 min-[1200px]:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-72 w-full rounded-lg" />
        ))}
      </div>
    </Container>
  );
}
