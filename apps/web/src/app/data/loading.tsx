import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui";

/** Skeleton for /data while the dataset index resolves. */
export default function DataLoading() {
  return (
    <Container>
      <div className="py-8 lg:py-10" aria-busy="true">
        <Skeleton className="mb-6 h-4 w-40" />
        <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
          <div className="min-w-0 flex-1 space-y-4">
            <Skeleton className="h-10 w-60" />
            <Skeleton className="h-5 w-full max-w-xl" />
            <Skeleton className="mt-6 h-8 w-full max-w-lg" />
            <Skeleton className="mt-6 h-40 w-full rounded-lg" />
            <Skeleton className="h-16 w-full" />
            <div className="grid gap-4 pt-6 md:grid-cols-2">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          </div>
          <div className="hidden shrink-0 lg:block lg:w-56">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              {Array.from({ length: 4 }).map((_, item) => (
                <Skeleton key={item} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
