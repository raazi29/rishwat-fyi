import { Skeleton } from "@/components/ui";

/** Loading state for the moderation queue while the paginated list resolves. */
export default function QueueLoading() {
  return (
    <div aria-busy="true">
      {/* Faux console top bar to match the loaded layout. */}
      <div className="border-b border-line bg-paper">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>

        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-24 rounded-full" />
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <Skeleton className="h-11 w-full rounded-none" />
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="mt-px h-16 w-full rounded-none" />
          ))}
        </div>
      </div>
    </div>
  );
}
