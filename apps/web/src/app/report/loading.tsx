import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui";

export default function ReportLoading() {
  return (
    <Container>
      <div className="py-6 lg:py-8">
        <Skeleton className="mb-5 h-4 w-40" />
        <div className="grid gap-8 xl:grid-cols-[288px_minmax(0,1fr)_264px]">
          <div className="hidden space-y-5 xl:block xl:col-start-1">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="xl:col-start-2">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="mt-6 h-16 w-full" />
            <Skeleton className="mt-6 h-96 w-full" />
          </div>
          <div className="hidden space-y-5 xl:block xl:col-start-3">
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    </Container>
  );
}
