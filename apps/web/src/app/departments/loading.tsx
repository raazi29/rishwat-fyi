import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui";

/** Skeleton for the /departments index. */
export default function DepartmentsLoading() {
  return (
    <Container>
      <div className="space-y-6 py-8 lg:py-10" aria-busy="true">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-full max-w-xl" />
        {Array.from({ length: 3 }).map((_, group) => (
          <div key={group} className="space-y-3">
            <Skeleton className="h-7 w-56" />
            <div className="space-y-3 rounded-lg border border-line bg-surface p-4">
              {Array.from({ length: 2 }).map((_, row) => (
                <Skeleton key={row} className="h-12 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
