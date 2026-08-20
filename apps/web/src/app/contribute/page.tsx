import type { Metadata } from "next";

import { ActionLink } from "@/components/ui";
import { CodeBlock, DocLayout, DocSection, DocTable, Prose, type TableOfContentsItem } from "@/components/doc";

export const metadata: Metadata = {
  title: "Contribute",
  description:
    "How to contribute to Rishwat.fyi: the repository layout, prerequisites, the real local-development quickstart, the available scripts, the test workflow, the code conventions, and the pull-request process.",
  alternates: { canonical: "/contribute" },
};

const TOC: TableOfContentsItem[] = [
  { id: "before", label: "Before you start" },
  { id: "layout", label: "Repository layout" },
  { id: "prerequisites", label: "Prerequisites" },
  { id: "setup", label: "Local setup" },
  { id: "scripts", label: "Available scripts" },
  { id: "tests", label: "Test workflow" },
  { id: "conventions", label: "Code conventions" },
  { id: "services", label: "Adding a service" },
  { id: "pull-requests", label: "Pull requests" },
];

const SETUP = `git clone <repository-url>
cd rishwat-fyi
npm install

cp .env.example .env      # then set JWT_SECRET (and anything marked change-me)

bash scripts/db-up.sh     # starts Docker PostGIS; creates dev + test databases
npm run db:migrate        # creates extensions, the search trigger, and migrations
npm run db:seed           # idempotent: real states/districts + 12 services
npm run dev               # API on http://localhost:8787 (PORT from .env)`;

const SMOKE = `curl -s localhost:8787/health
curl -s "localhost:8787/search?q=licence"
curl -s localhost:8787/services/driving-licence
curl -s localhost:8787/datasets`;

const TESTS = `bash scripts/db-up.sh                # ensure Docker DB is running
npm run db:migrate                   # schema must exist in the test DB
npm run test                         # all workspaces`;

export default function ContributePage() {
  return (
    <DocLayout
      title="Contribute"
      lead="Rishwat.fyi is open-source, citizen-powered transparency infrastructure. The data and software are public infrastructure that must survive any single website — that only works if the contribution process is open, reviewable, and safe."
      toc={TOC}
      sourcePath="docs/contributing.md"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contribute" }]}
    >
      <DocSection id="before" title="Before you start" lead="Read the core documents first.">
        <Prose className="prose-measure">
          <ul>
            <li>
              <a href="/methodology">Methodology</a> — how reports become statistics, and the
              publishing thresholds.
            </li>
            <li>
              <a href="/privacy">Privacy</a> — the PII rules every contribution must respect.
            </li>
            <li>
              <a href="/moderation">Moderation</a> — how reports are reviewed.
            </li>
            <li>
              <a href="/governance">Governance</a> — roles and independence.
            </li>
            <li>
              <a href="/data/dictionary">Data dictionary</a> — the public dataset contract.
            </li>
          </ul>
        </Prose>
      </DocSection>

      <DocSection id="layout" title="Repository layout">
        <CodeBlock
          copy={false}
          label="Monorepo"
          code={`apps/api/             Hono API server (public + admin routes, storage adapters)
packages/database     Drizzle schema (domain-split), migrations, seed data
packages/validation   zod schemas shared by the API (and future frontend)
data/                 Open schemas (data/schemas/) and generated dataset exports
docs/                 All documentation
scripts/              Dev helpers (db-up, db-migrate, db-seed)
plan/                 Product vision and implementation plans`}
        />
        <Prose className="prose-measure mt-6">
          <p>
            The backend is a single npm-workspaces monorepo. The public API is the contract; nothing
            depends on frontend code.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="prerequisites" title="Prerequisites">
        <Prose className="prose-measure">
          <ul>
            <li>
              <strong>Node.js ≥ 20</strong> (enforced by the root <code>package.json</code>)
            </li>
            <li>
              <strong>npm</strong> (npm workspaces)
            </li>
            <li>
              <strong>Docker</strong> — for the local PostgreSQL + PostGIS dev/test database
            </li>
            <li>
              <strong>Git</strong>
            </li>
          </ul>
          <p>
            You do not need a Supabase account for local development. Supabase is the production
            target, but the code runs identically on the Docker PostGIS database — only the connection
            string and storage driver change.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="setup"
        title="Local development setup"
        lead="The full quickstart, exactly as in the repository README and CONTRIBUTING."
      >
        <CodeBlock code={SETUP} label="Set up and run the API" ariaLabel="Local development setup commands" />
        <Prose className="prose-measure mt-6">
          <p>Smoke-test that everything is up:</p>
        </Prose>
        <CodeBlock code={SMOKE} label="Smoke test" ariaLabel="Smoke-test commands" />
      </DocSection>

      <DocSection id="scripts" title="Available scripts">
        <DocTable
          caption="npm scripts"
          columns={[
            { key: "command", header: "Command", primary: true },
            { key: "does", header: "What it does" },
          ]}
          rows={[
            { command: <code className="font-mono text-ink">npm run dev</code>, does: "Start the API in watch mode" },
            { command: <code className="font-mono text-ink">npm test</code>, does: "Run all workspace tests (vitest)" },
            { command: <code className="font-mono text-ink">npm run typecheck</code>, does: "Type-check every workspace" },
            { command: <code className="font-mono text-ink">npm run db:up</code>, does: "Start Docker PostGIS" },
            { command: <code className="font-mono text-ink">npm run db:migrate</code>, does: "Apply extensions + migrations" },
            { command: <code className="font-mono text-ink">npm run db:seed</code>, does: "Upsert seed data (idempotent)" },
            { command: <code className="font-mono text-ink">npm run create-admin</code>, does: "Create/update the admin user from ADMIN_EMAIL / ADMIN_PASSWORD" },
            { command: <code className="font-mono text-ink">npm run generate -w packages/database</code>, does: "Generate migration SQL from the Drizzle schema" },
            { command: <code className="font-mono text-ink">npm run export -w apps/api</code>, does: "Write dataset exports + manifest to data/exports/" },
          ]}
        />
      </DocSection>

      <DocSection
        id="tests"
        title="Test workflow"
        lead="Tests run against a real Postgres test database — no mocks, no in-memory stand-ins."
      >
        <CodeBlock code={TESTS} label="Run the test suite" ariaLabel="Test workflow commands" />
        <Prose className="prose-measure mt-6">
          <p>
            CI runs the same thing on a PostGIS service container: <code>npm ci</code>,{" "}
            <code>npm run typecheck</code>, <code>npm test</code>. If it is green locally, it is green
            in CI.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="conventions"
        title="Code conventions"
        lead="Enforced by review and by the ~200-line file cap. Respect them in every PR."
      >
        <Prose className="prose-measure">
          <ul>
            <li>
              <strong>No monolith files.</strong> Every source file stays under ~200 lines; schema and
              seed files are split by domain.
            </li>
            <li>
              <strong>No mocks, hardcodes or placeholders.</strong> No <code>TBD</code>, no TODO stubs,
              no in-memory stand-ins. Everything real.
            </li>
            <li>
              <strong>Parameterized SQL only.</strong> User input is never string-interpolated into
              SQL — use Drizzle <code>sql</code> template literals.
            </li>
            <li>
              <strong>Money is numeric(12,2) INR, never floats</strong>, constrained to 0–10,000,000
              in multiples of 0.01.
            </li>
            <li>
              <strong>PII rule.</strong> Never store raw IP, device fingerprint or submission token —
              store only SHA-256 hex digests, and never return them.
            </li>
            <li>
              <strong>Enums match exactly.</strong> The zod schema mirrors the Postgres{" "}
              <code>report_status</code> enum.
            </li>
            <li>
              <strong>Errors</strong> use <code>AppError(status, code, message)</code> and serialise as{" "}
              <code>{'{ "error": { "code", "message" } }'}</code>.
            </li>
          </ul>
        </Prose>
      </DocSection>

      <DocSection
        id="services"
        title="Adding a new service"
        lead="A fee or timeline shown on a service page must have a real government source. Never invent figures."
      >
        <Prose className="prose-measure">
          <p>
            Service seeds live in <code>packages/database/src/seed/services/</code>, split by domain
            (transport, land, police, municipal, revenue, commerce). Each <code>ServiceSeed</code>{" "}
            carries a kebab-case <code>slug</code>, a <code>name</code>, its department, a{" "}
            <code>description</code>, and the official figures with a citable source URL:
          </p>
          <ul>
            <li>
              Every official number needs a government source: <code>url</code>, <code>title</code>,{" "}
              <code>department</code>, and <code>publication_date</code> where known.
            </li>
            <li>Use real portal URLs (parivahan.gov.in, passportindia.gov.in, gst.gov.in, state IGRS and municipal portals).</li>
            <li>Where a fee is state-specific, use Uttar Pradesh figures and note it in the description.</li>
            <li>
              The seed runner upserts by <code>url</code> and <code>slug</code>, so re-running{" "}
              <code>npm run db:seed</code> is safe and idempotent.
            </li>
          </ul>
          <p>
            After adding a service, run <code>npm run db:seed</code> and{" "}
            <code>npm run test -w packages/database</code>, and keep the count assertion in{" "}
            <code>seed.test.ts</code> truthful. If a new category affects the dataset surface, update
            the <a href="/data/dictionary">data dictionary</a> and the OpenAPI spec.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="pull-requests" title="Pull request process">
        <Prose className="prose-measure">
          <ol>
            <li>Work on a branch off <code>main</code>, named for the change (e.g. <code>feat/add-police-clearance-service</code>).</li>
            <li>Keep the change small and focused — one logical change per PR.</li>
            <li>
              Run the full gate before pushing: <code>npm run typecheck</code> and <code>npm test</code>.
            </li>
            <li>Self-review your diff: no PII, no raw identifiers, no TODO/mocks, parameterized SQL, no files past ~200 lines.</li>
            <li>Open the PR describing what changed, why, and what was tested. CI must be green.</li>
            <li>Address review feedback. Maintainers merge after review; contributors do not merge their own PRs.</li>
          </ol>
          <h3>Licensing</h3>
          <p>
            Code is <strong>MIT</strong>; dataset exports are <strong>CC BY 4.0</strong> (attribution
            required). By contributing, you agree to license your contributions accordingly, and never
            to contribute data containing personal information about other people — the do-not-publish
            list in <a href="/privacy">privacy</a> applies to contributors too.
          </p>
        </Prose>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          <ActionLink href="/data">Explore the open data</ActionLink>
          <ActionLink href="/data/api">Read the API reference</ActionLink>
          <ActionLink href="/mirroring">Mirror the dataset</ActionLink>
        </div>
      </DocSection>
    </DocLayout>
  );
}
