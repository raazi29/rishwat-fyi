import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui";

/** Skeleton for /departments/[slug] while the department and its services resolve. */
export default function DepartmentDetailLoading() {
  return (
    <Container>
      <div className="py-6" aria-busy="true">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="mt-4 h-9 w-72" />
        <Skeleton className="mt-2 h-5 w-full max-w-lg" />
      </div>

      <div className="space-y-8 pb-10" aria-busy="true">
        <div className="space-y-3">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-7 w-48" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
