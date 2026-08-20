"use client";

import { useEffect } from "react";

import { Container } from "@/components/layout/container";
import { Button, ButtonLink } from "@/components/ui";
import { AlertIcon, ArrowLeftIcon, RefreshIcon } from "@/components/icons";

/**
 * Root error boundary. Neutral in tone — this system reserves red for the
 * citizen-reported data channel, so an error never renders in red (DESIGN.md
 * §Colors rule 1). Users see a plain explanation and a retry, never a stack
 * trace; the digest is logged for operators instead.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced to the operator's console/log pipeline, never to the reader.
    console.error("Unhandled error", error);
  }, [error]);

  return (
    <Container>
      <div className="mx-auto flex max-w-xl flex-col items-center py-16 text-center lg:py-24">
        <span
          aria-hidden="true"
          className="inline-flex size-12 items-center justify-center rounded-tile bg-sand text-official-mid"
        >
          <AlertIcon size={26} />
        </span>
        <h1 className="mt-5 font-serif text-h1 font-bold text-ink">Something went wrong</h1>
        <p className="mt-3 max-w-[52ch] text-body-lg text-ink-secondary">
          This page could not be displayed just now. The problem has been logged. You can try again,
          or return to the home page.
        </p>

        {error.digest ? (
          <p className="mt-3 font-mono text-label text-ink-muted">Reference: {error.digest}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="primary" onClick={reset} iconLeading={<RefreshIcon size={18} />}>
            Try again
          </Button>
          <ButtonLink href="/" variant="secondary" iconLeading={<ArrowLeftIcon size={18} />}>
            Back to home
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
