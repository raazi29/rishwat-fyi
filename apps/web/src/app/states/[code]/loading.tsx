import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui";

/** Skeleton for /states/[code] while the state detail resolves. */
export default function StateDetailLoading() {
  return (
    <Container>
      <div className="py-6" aria-busy="true">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="mt-4 h-9 w-56" />
        <Skeleton className="mt-2 h-5 w-full max-w-lg" />
      </div>

      <div className="space-y-8 pb-10" aria-busy="true">
        <Skeleton className="h-28 w-full rounded-lg" />
        <div className="space-y-3">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-7 w-48" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
