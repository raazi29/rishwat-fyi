import { Container } from "@/components/layout/container";
import { ButtonLink, EmptyState } from "@/components/ui";
import { DocumentIcon } from "@/components/icons";

export default function PublicReportNotFound() {
  return (
    <Container>
      <div className="py-16">
        <div className="mx-auto max-w-xl rounded-lg border border-line bg-surface">
          <EmptyState
            icon={<DocumentIcon />}
            title="Report not found"
            description="We couldn't find a public report with that ID. It may not exist, or it may not be published. If you filed it, you can still check its status with your report ID and one-time token."
            action={
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <ButtonLink href="/report/status" variant="primary">
                  Check a report status
                </ButtonLink>
                <ButtonLink href="/search" variant="secondary">
                  Explore services
                </ButtonLink>
              </div>
            }
          />
        </div>
      </div>
    </Container>
  );
}
