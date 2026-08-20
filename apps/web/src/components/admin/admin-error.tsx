import { ButtonLink, ErrorState } from "@/components/ui";
import { RefreshIcon } from "@/components/icons";
import type { ApiFailure } from "@/lib/api";

/**
 * The admin error state. Admin resources never fall back to sample data, so a
 * failed call is shown here with the API's own message and code. Neutral by
 * design — red is a data channel in this system, not an error colour
 * (DESIGN.md §Colors rule 1).
 */
export function AdminError({
  error,
  title = "This data could not be loaded",
  retryHref,
}: {
  error: ApiFailure;
  title?: string;
  retryHref?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface">
      <ErrorState
        title={title}
        description={
          <>
            <span className="block text-ink-secondary">{error.message}</span>
            <span className="mt-2 block text-label text-ink-muted">
              This is the live response from the API — admin views never fall back to sample data.{" "}
              <span className="font-mono">
                {error.code}
                {typeof error.status === "number" ? ` \u00b7 ${error.status}` : ""}
              </span>
            </span>
          </>
        }
        action={
          retryHref ? (
            <ButtonLink href={retryHref} variant="secondary" iconLeading={<RefreshIcon size={18} />}>
              Try again
            </ButtonLink>
          ) : undefined
        }
      />
    </div>
  );
}
