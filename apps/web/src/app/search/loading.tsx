import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui";

/** Skeleton for /search while the rail data and comparison rows resolve. */
export default function SearchLoading() {
  return (
    <Container>
      <div className="space-y-6 py-6 lg:py-8" aria-busy="true">
        <Skeleton className="h-[52px] w-full" />
        <div className="grid gap-6 lg:grid-cols-[264px_1fr]">
          <div className="hidden flex-col gap-4 lg:flex">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-[42px] w-full" />
            <Skeleton className="h-[42px] w-full" />
            <Skeleton className="h-[42px] w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-4 w-72" />
            <div className="space-y-3 rounded-lg border border-line bg-surface p-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
