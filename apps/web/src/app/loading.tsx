import { Container } from "@/components/layout/container";
import { Card, Skeleton } from "@/components/ui";

/**
 * Loading skeleton for the home page. Mirrors the composition of `page.tsx`:
 * the two-column hero (proposition + actions on the left, illustration over the
 * stat/map panel on the right), then the "How it works" band, the principles
 * strip and the closing open-data band. Sunken pulse blocks, never a spinner
 * (DESIGN.md §Components).
 */
export default function HomeLoading() {
  return (
    <Container>
      <div className="space-y-5 py-8 lg:space-y-8 lg:py-10" aria-busy="true" aria-hidden="true">
        {/* Sample-data strip placeholder */}
        <Skeleton className="h-14 w-full" />

        {/* Hero */}
        <div className="grid grid-cols-1 items-start gap-10 py-4 lg:grid-cols-2 lg:gap-12 lg:py-8">
          {/* Left: headline, proposition, search, actions */}
          <div className="flex flex-col gap-6">
            <div className="space-y-3">
              <Skeleton className="h-14 w-3/4" />
              <Skeleton className="h-14 w-2/3" />
              <Skeleton className="h-14 w-1/2" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-full max-w-md" />
              <Skeleton className="h-5 w-full max-w-sm" />
            </div>
            <Skeleton className="h-14 w-full max-w-xl" />
            <Skeleton className="h-5 w-72" />
            <div className="grid max-w-xl gap-4 sm:grid-cols-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>

          {/* Right: illustration over the stat + gap panel */}
          <div className="flex flex-col gap-6">
            <Skeleton className="mx-auto h-48 w-full max-w-xl" />
            <Card className="p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Skeleton className="size-9 shrink-0 rounded-tile" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="my-6 border-t border-line-inner" />
              <div className="space-y-4">
                <Skeleton className="h-5 w-56" />
                <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_14rem]">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="space-y-2.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} className="h-6 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* How it works band */}
        <div className="rounded-lg border border-line bg-sunken p-6 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,15rem)_1fr] lg:gap-12">
            <div className="space-y-3">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-full max-w-xs" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex flex-col gap-6 lg:flex-row lg:gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-7 shrink-0 rounded-full" />
                    <Skeleton className="size-9 shrink-0 rounded-tile" />
                  </div>
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Principles strip */}
        <div className="grid grid-cols-1 rounded-lg border border-line bg-surface sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-start gap-3 p-5">
              <Skeleton className="size-9 shrink-0 rounded-tile" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Open-data band */}
        <div className="flex flex-col gap-5 rounded-lg border border-line bg-sunken p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
          <Skeleton className="h-8 w-80 max-w-full" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-11 w-32" />
            <Skeleton className="h-11 w-24" />
            <Skeleton className="h-11 w-40" />
          </div>
        </div>
      </div>
    </Container>
  );
}
