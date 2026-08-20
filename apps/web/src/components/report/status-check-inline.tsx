"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button, TextInput } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";

/**
 * The compact "Check your report status anytime" form from the submitted board.
 * It only forwards the report ID to `/report/status` (prefilled); the one-time
 * token is entered there, never carried around the app.
 */
export function StatusCheckInline() {
  const router = useRouter();
  const [id, setId] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const value = id.trim();
        router.push(value ? `/report/status?id=${encodeURIComponent(value)}` : "/report/status");
      }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <label htmlFor="submitted-status-id" className="sr-only">
        Report ID
      </label>
      <TextInput
        id="submitted-status-id"
        value={id}
        placeholder="Enter report ID (e.g. R-xxxxxxxx)"
        autoComplete="off"
        className="sm:flex-1"
        onChange={(event) => setId(event.target.value)}
      />
      <Button type="submit" variant="primary" iconTrailing={<ArrowRightIcon size={18} />}>
        Check status
      </Button>
    </form>
  );
}
