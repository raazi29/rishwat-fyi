import type { Metadata } from "next";

import { ActionLink, ButtonLink, Callout } from "@/components/ui";
import { ExternalIcon, LockIcon } from "@/components/icons";
import {
  CodeBlock,
  DocLayout,
  DocSection,
  DocTable,
  EndpointCard,
  Prose,
  type TableOfContentsItem,
} from "@/components/doc";
import { apiBaseUrl } from "@/lib/api";

import { PUBLIC_GROUPS } from "./_data/public-endpoints";
import { ADMIN_ENDPOINTS } from "./_data/admin-endpoints";

export const metadata: Metadata = {
  title: "API reference",
  description:
    "The public contract of the Rishwat.fyi platform: base URL, conventions, rate limits, authentication, and every public and admin endpoint with parameters and example responses. The OpenAPI spec is authoritative for wire format.",
  alternates: { canonical: "/data/api" },
};

const TOC: TableOfContentsItem[] = [
  { id: "base-url", label: "Base URL & conventions" },
  { id: "rate-limits", label: "Rate limits" },
  { id: "authentication", label: "Authentication" },
  {
    id: "public",
    label: "Public endpoints",
    children: PUBLIC_GROUPS.map((group) => ({ id: group.id, label: group.title, level: 3 as const })),
  },
  { id: "admin", label: "Admin endpoints" },
];

export default function ApiReferencePage() {
  const base = apiBaseUrl();
  const openapiUrl = `${base}/doc/openapi.json`;

  return (
    <DocLayout
      title="API reference"
      lead="The Rishwat.fyi API is the public contract of the platform. It serves the public data layer — search, services, locations, reports, evidence metadata, datasets, documentation — and a separate, authenticated area for moderators and admins."
      toc={TOC}
      sourcePath="docs/api.md"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Data", href: "/data" }, { label: "API" }]}
    >
      <DocSection
        id="base-url"
        title="Base URL and conventions"
        lead="All paths below are relative to the base URL — the value of the PUBLIC_BASE_URL environment variable."
      >
        <CodeBlock code={base} label="Base URL" ariaLabel="The API base URL" />
        <Prose className="prose-measure mt-6">
          <ul>
            <li>
              <strong>Content type.</strong> JSON (<code>application/json</code>) except{" "}
              <code>GET /datasets/reports.csv</code> (<code>text/csv</code>) and evidence uploads
              (<code>multipart/form-data</code>).
            </li>
            <li>
              <strong>Money.</strong> Monetary values are decimal strings (e.g. <code>&quot;1500.00&quot;</code>)
              matching <code>numeric(12,2)</code> precision, never floats.
            </li>
            <li>
              <strong>Pagination.</strong> List endpoints accept <code>page</code> (≥ 1, default 1)
              and <code>per_page</code> (1–100, default 20) and return <code>{"{ total, items }"}</code>.
            </li>
            <li>
              <strong>Errors.</strong> Every non-2xx response uses the envelope below. Codes include{" "}
              <code>not_found</code>, <code>unauthorized</code>, <code>forbidden</code>,{" "}
              <code>bad_request</code>, <code>conflict</code>, <code>too_many_requests</code> and{" "}
              <code>internal_error</code>.
            </li>
          </ul>
        </Prose>
        <CodeBlock
          code={`{ "error": { "code": "not_found", "message": "…" } }`}
          label="Error envelope"
          ariaLabel="The standard error envelope"
        />
        <Prose className="prose-measure mt-6">
          <p>
            The machine-readable version of this reference is the OpenAPI 3.0 specification served by
            the API itself. When this page and the spec disagree, the spec is authoritative for wire
            format; the <a href="/data/dictionary">data dictionary</a> is authoritative for dataset
            semantics.
          </p>
        </Prose>
        <div className="mt-4">
          <ButtonLink href={openapiUrl} external variant="secondary" iconTrailing={<ExternalIcon size={16} />}>
            Open /doc/openapi.json
          </ButtonLink>
        </div>
      </DocSection>

      <DocSection id="rate-limits" title="Rate limits" lead="Limiters key on the client IP. An exceeded limit returns 429 with too_many_requests.">
        <DocTable
          caption="Rate limits"
          columns={[
            { key: "limiter", header: "Limiter", primary: true },
            { key: "limit", header: "Limit" },
            { key: "applied", header: "Applied to" },
          ]}
          rows={[
            {
              limiter: <code className="font-mono text-ink">standardLimiter</code>,
              limit: "60 / min per IP",
              applied: "Public reads (/search, /services, /locations, /states, /departments)",
            },
            {
              limiter: <code className="font-mono text-ink">strictLimiter</code>,
              limit: "3 / hour per IP",
              applied: <code className="font-mono">POST /reports</code>,
            },
            {
              limiter: <code className="font-mono text-ink">evidenceLimiter</code>,
              limit: "10 / hour per IP",
              applied: <code className="font-mono">POST /evidence</code>,
            },
            {
              limiter: <code className="font-mono text-ink">authLimiter</code>,
              limit: "Dedicated per-IP limiter",
              applied: <code className="font-mono">POST /admin/auth/login</code>,
            },
          ]}
        />
        <Prose className="prose-measure mt-6">
          <p>
            Authed admin/moderation endpoints are bounded by their short-lived JWTs (12 h) rather than
            a documented public rate limit.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="authentication"
        title="Authentication"
        lead="Admin routes require a JWT issued by POST /admin/auth/login, sent as Authorization: Bearer <token>."
      >
        <Prose className="prose-measure">
          <ul>
            <li>
              <code>moderator</code> — can work the moderation queue (view queue, decide reports,
              review evidence).
            </li>
            <li>
              <code>admin</code> — everything a moderator can do, plus the stats endpoints.
            </li>
          </ul>
          <p>
            A missing or invalid token returns <code>401 unauthorized</code>; a valid token with
            insufficient role returns <code>403 forbidden</code>. There is no user enumeration on
            login: unknown email and wrong password both return the same <code>401</code>.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="public"
        title="Public endpoints"
        lead="The stable public contract. Reads are rate-limited; writes are strictly rate-limited and anonymous."
      >
        <div className="space-y-10">
          {PUBLIC_GROUPS.map((group) => (
            <div key={group.id}>
              <h3 id={group.id} className="scroll-mt-24 font-sans text-h3 font-semibold text-ink">
                {group.title}
              </h3>
              <div className="mt-4 space-y-5">
                {group.endpoints.map((spec) => (
                  <EndpointCard key={spec.path} spec={spec} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        id="admin"
        title="Admin endpoints"
        lead="Authenticated moderator and admin routes. Not part of the public surface — listed here for completeness and for the people who operate the queue."
      >
        <Callout tone="info" icon={<LockIcon size={20} />} title="Authenticated area">
          All admin endpoints except <code>POST /admin/auth/login</code> require a Bearer JWT. These
          routes are not indexed and are not reachable without moderator or admin credentials.
        </Callout>
        <div className="mt-6 space-y-5">
          {ADMIN_ENDPOINTS.map((spec) => (
            <EndpointCard key={spec.path} spec={spec} />
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          <ActionLink href="/data/dictionary">Dataset semantics — the data dictionary</ActionLink>
          <ActionLink href="/methodology">The methodology behind the numbers</ActionLink>
          <ActionLink href="/mirroring">Mirror the dataset</ActionLink>
        </div>
      </DocSection>
    </DocLayout>
  );
}
