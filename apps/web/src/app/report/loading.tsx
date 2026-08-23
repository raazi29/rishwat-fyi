import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui";

export default function ReportLoading() {
  return (
    <Container>
      <div className="mx-auto max-w-[800px] py-6 lg:py-8">
        <Skeleton className="mb-5 h-4 w-40" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="mt-2 h-5 w-full max-w-[42ch]" />
        <Skeleton className="mt-5 h-24 w-full" />
        <Skeleton className="mt-6 h-16 w-full" />
        <Skeleton className="mt-6 h-96 w-full" />
      </div>
    </Container>
  );
}
