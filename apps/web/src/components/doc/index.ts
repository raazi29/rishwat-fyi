/**
 * Barrel for the Read-mode documentation kit. Import from `@/components/doc`.
 *
 * The kit renders the repository's normative documents (docs/*.md) as
 * first-class Read surfaces: a reading column, a sticky in-page table of
 * contents, typographic prose, definition lists, API endpoint cards, copyable
 * code blocks, and the publishing-threshold callout.
 */

export { DocLayout } from "./doc-layout";
export { DocToc } from "./doc-toc";
export { DocSection } from "./doc-section";
export { Prose } from "./prose";
export { CodeBlock } from "./code-block";
export { ThresholdCallout } from "./threshold-callout";

export { DocTable } from "./doc-table";
export type { DocTableColumn, DocTableRow } from "./doc-table";

export { DefinitionList } from "./definition-list";
export type { DefinitionFact, DefinitionItem } from "./definition-list";

export { EndpointCard } from "./endpoint-card";
export type { EndpointSpec, EndpointParam, EndpointAuth, HttpMethod } from "./endpoint-card";

export type { TableOfContentsItem, DocSource } from "./types";
