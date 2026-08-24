import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { formatDateTime } from "@/lib/utils/format";
import { DataFreshness } from "./data-freshness";

/**
 * DataFreshness is a supplementary "last updated" line shown beside citizen
 * aggregates. Its whole contract is: render the formatted time when one is
 * given, and render nothing at all when it is not (so pages that lack a
 * timestamp — e.g. sample-data fallbacks — never show a fabricated one).
 */
describe("DataFreshness", () => {
  const iso = "2026-08-20T09:30:00.000Z";

  it("renders the formatted timestamp when updatedAt is present", () => {
    const html = renderToStaticMarkup(createElement(DataFreshness, { updatedAt: iso }));
    expect(html).toContain("Data last updated");
    // It renders through the shared formatter rather than the raw ISO string.
    expect(html).toContain(formatDateTime(iso));
    expect(html).not.toContain(iso);
    // A clock icon and the muted small-label styling accompany the line.
    expect(html).toContain("<svg");
    expect(html).toContain("text-label");
    expect(html).toContain("text-ink-muted");
  });

  it("forwards a custom className", () => {
    const html = renderToStaticMarkup(
      createElement(DataFreshness, { updatedAt: iso, className: "mt-3" }),
    );
    expect(html).toContain("mt-3");
  });

  it("renders nothing when updatedAt is null", () => {
    const html = renderToStaticMarkup(createElement(DataFreshness, { updatedAt: null }));
    expect(html).toBe("");
  });

  it("renders nothing when updatedAt is undefined", () => {
    const html = renderToStaticMarkup(createElement(DataFreshness, { updatedAt: undefined }));
    expect(html).toBe("");
  });
});
