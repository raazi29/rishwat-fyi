import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui";

/** Skeleton for /map while the state gaps resolve. */
export default function MapLoading() {
  return (
    <Container>
      <div className="space-y-8 py-8 lg:py-10" aria-busy="true">
        <div className="space-y-3">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-12 w-full max-w-md" />
        </div>

        <Skeleton className="h-[26rem] w-full rounded-lg" />

        <div className="space-y-3">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-[22rem] w-full rounded-lg" />
        </div>
      </div>
    </Container>
  );
}
