import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui";

export default function PublicReportLoading() {
  return (
    <Container>
      <div className="py-8 lg:py-10">
        <Skeleton className="mb-4 h-4 w-56" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
        <Skeleton className="mt-8 h-48 w-full" />
        <Skeleton className="mt-8 h-32 w-full" />
        <Skeleton className="mt-8 h-24 w-full" />
      </div>
    </Container>
  );
}
