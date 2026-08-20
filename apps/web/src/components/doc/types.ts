/**
 * Types for the Read-mode documentation kit.
 *
 * A Read page is an article with an optional in-page table of contents rail
 * and a provenance note pointing at the repository document it renders.
 */

/**
 * A single entry in an in-page table of contents. `level` maps to the heading
 * rank it links to (h2 → 2, h3 → 3). Nested `children` render as an indented
 * sub-list and are tracked independently by DocToc's active-heading observer.
 */
export interface TableOfContentsItem {
  /** The id of the heading this entry links to (the `#id` fragment). */
  id: string;
  /** The label shown in the rail — usually the heading text, sometimes shorter. */
  label: string;
  /** Heading rank the entry points at. Defaults to 2 (a section heading). */
  level?: 2 | 3;
  /** Optional nested sub-headings shown beneath this entry. */
  children?: TableOfContentsItem[];
}

/**
 * Provenance for a Read page: the repository document it was rendered from.
 * The interface is replaceable; the source document is the record
 * (Product Principle 5).
 */
export interface DocSource {
  /** Repo-relative path, e.g. `docs/methodology.md`. Rendered in mono. */
  path: string;
  /** Optional absolute URL when a canonical source location is known. */
  href?: string;
}
