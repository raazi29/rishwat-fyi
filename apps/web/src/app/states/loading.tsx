import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui";

/** Skeleton for the /states index. */
export default function StatesLoading() {
  return (
    <Container>
      <div className="space-y-8 py-8 lg:py-10" aria-busy="true">
        <div className="space-y-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>

        <Skeleton className="h-[20rem] w-full rounded-lg" />

        {Array.from({ length: 2 }).map((_, group) => (
          <div key={group} className="space-y-3">
            <Skeleton className="h-7 w-56" />
            <div className="space-y-3 rounded-lg border border-line bg-surface p-4">
              {Array.from({ length: 3 }).map((_, row) => (
                <Skeleton key={row} className="h-12 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
