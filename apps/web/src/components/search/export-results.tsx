import { ButtonLink } from "@/components/ui";
import { DownloadIcon } from "@/components/icons";
import { datasetDownloadUrl } from "@/lib/api";

/**
 * "Export results" — the interface is replaceable, the data is not (Product
 * Principle 5). Links straight to the published CSV export, which the API
 * serves `no-store`. It is a plain download link, so it works without JS.
 */
export function ExportResults({ className }: { className?: string }) {
  return (
    <ButtonLink
      href={datasetDownloadUrl("reports", "csv")}
      external
      variant="secondary"
      size="sm"
      iconLeading={<DownloadIcon size={18} />}
      className={className}
    >
      Export results
    </ButtonLink>
  );
}
