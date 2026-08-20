import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui";

/** Skeleton for /mirroring while the dataset index resolves. */
export default function MirroringLoading() {
  return (
    <Container>
      <div className="py-8 lg:py-10" aria-busy="true">
        <Skeleton className="mb-6 h-4 w-56" />
        <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
          <div className="min-w-0 flex-1 space-y-4">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-5 w-full max-w-xl" />
            <Skeleton className="h-5 w-4/5 max-w-lg" />
            <Skeleton className="mt-6 h-16 w-full" />
            {Array.from({ length: 3 }).map((_, section) => (
              <div key={section} className="space-y-3 pt-8">
                <Skeleton className="h-7 w-52" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            ))}
          </div>
          <div className="hidden shrink-0 lg:block lg:w-56">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              {Array.from({ length: 6 }).map((_, item) => (
                <Skeleton key={item} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
