"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

import { Container } from "@/components/layout/container";
import { Button, ButtonLink } from "@/components/ui";
import { AlertIcon, ArrowLeftIcon, RefreshIcon } from "@/components/icons";

/**
 * Root error boundary. Neutral in tone — this system reserves red for the
 * citizen-reported data channel, so an error never renders in red (DESIGN.md
 * §Colors rule 1). Users see a plain explanation and a retry, never a stack
 * trace; the digest is logged for operators instead.
 *
 * The offline illustration is reserved for an actually offline browser
 * (`navigator.onLine === false`); a render/data failure while the browser is
 * connected — the common case, e.g. the API being unreachable — gets a plain
 * alert glyph instead, so the artwork never claims a connectivity problem the
 * reader does not have.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // Surfaced to the operator's console/log pipeline, never to the reader.
    console.error("Unhandled error", error);
  }, [error]);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <Container>
      <div className="mx-auto flex max-w-xl flex-col items-center py-16 text-center lg:py-24">
        {offline ? (
          <div className="w-full max-w-[340px] overflow-hidden rounded-lg border border-line">
            <Image
              src="/brand/illustration-offline.webp"
              alt=""
              width={960}
              height={640}
              sizes="340px"
              priority
              className="h-auto w-full"
            />
          </div>
        ) : (
          <div className="flex size-16 items-center justify-center rounded-full bg-sand text-official-mid">
            <AlertIcon size={30} />
          </div>
        )}
        <h1 className="mt-6 font-serif text-h1 font-bold text-ink">
          {offline ? "No internet connection" : "Something went wrong"}
        </h1>
        <p className="mt-3 max-w-[52ch] text-body-lg text-ink-secondary">
          {offline
            ? "You appear to be offline. Reconnect and try again — a previously loaded page may still work."
            : "This page could not be displayed just now. The problem has been logged. You can try again, or return to the home page."}
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
