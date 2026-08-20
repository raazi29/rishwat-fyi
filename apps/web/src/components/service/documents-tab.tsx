import type { OfficialDocument } from "@/lib/api";
import { Badge, EmptyState } from "@/components/ui";
import { CheckCircleIcon, DocumentIcon } from "@/components/icons";

/**
 * The Documents tab: the official checklist, split into required and optional
 * documents exactly as the government catalogue lists them. This is official
 * data — it carries no citizen-reported channel and no red.
 */
function DocList({
  heading,
  documents,
  required,
}: {
  heading: string;
  documents: OfficialDocument[];
  required: boolean;
}) {
  if (documents.length === 0) return null;
  return (
    <section aria-label={heading}>
      <h3 className="mb-3 text-h3 font-semibold text-ink">{heading}</h3>
      <ul className="divide-y divide-line-inner rounded-lg border border-line bg-surface">
        {documents.map((document) => (
          <li key={document.name} className="flex items-start justify-between gap-3 p-4">
            <span className="flex min-w-0 items-start gap-3">
              <span aria-hidden="true" className="mt-0.5 shrink-0 text-official-mid">
                <CheckCircleIcon size={18} />
              </span>
              <span className="text-body text-ink">{document.name}</span>
            </span>
            <Badge tone={required ? "sage" : "neutral"} className="shrink-0">
              {required ? "Required" : "Optional"}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DocumentsTab({ documents }: { documents: OfficialDocument[] }) {
  const requiredDocs = documents.filter((document) => document.required);
  const optionalDocs = documents.filter((document) => !document.required);

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={<DocumentIcon />}
        title="No document list published"
        description="The official document checklist for this service is not available yet."
        className="rounded-lg border border-line bg-surface"
      />
    );
  }

  return (
    <div className="space-y-8">
      <DocList heading="Required documents" documents={requiredDocs} required />
      <DocList heading="Optional documents" documents={optionalDocs} required={false} />
    </div>
  );
}
