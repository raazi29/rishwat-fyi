import { Skeleton } from "@/components/ui";

/** Login loading state — a centred card skeleton, matching the sign-in layout. */
export default function AdminLoginLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12" aria-busy="true">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="space-y-5 rounded-lg border border-line bg-surface p-6">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-[42px] w-full" />
          <Skeleton className="h-[42px] w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </div>
  );
}
