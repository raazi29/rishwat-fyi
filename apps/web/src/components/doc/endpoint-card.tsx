import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/surface";
import { LockIcon } from "@/components/icons";
import { CodeBlock } from "./code-block";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
/**
 * `submitter` is not staff auth: it means the caller must present the one-time
 * token handed to whoever filed the report. Anyone can call the endpoint, but
 * only for their own report.
 */
export type EndpointAuth = "public" | "submitter" | "moderator" | "admin";

export interface EndpointParam {
  name: string;
  type: string;
  required?: boolean;
  notes: ReactNode;
}

export interface EndpointSpec {
  id?: string;
  method: HttpMethod;
  path: string;
  auth: EndpointAuth;
  /** Human rate-limit label, e.g. "60 / min" or "3 / hour". */
  rateLimit?: string;
  summary: ReactNode;
  params?: EndpointParam[];
  request?: string;
  requestLabel?: string;
  response?: string;
  responseLabel?: string;
  note?: ReactNode;
}

const METHOD_TONES: Record<HttpMethod, string> = {
  // Green = actionable (POST performs a write); sage = a safe read.
  GET: "bg-sage text-official-mid",
  POST: "bg-official text-white",
  PUT: "bg-sand text-ink",
  PATCH: "bg-sand text-ink",
  DELETE: "bg-sand text-ink",
};

const AUTH_LABELS: Record<EndpointAuth, string> = {
  public: "Public",
  submitter: "Submitter token",
  moderator: "Moderator",
  admin: "Admin",
};

/**
 * One API endpoint, documented: a method chip, the path in mono, an auth badge
 * and rate-limit label, a summary, an optional parameter table, and example
 * request/response blocks. It is a single Card — inner sections are separated
 * by hairlines rather than nested cards (DESIGN.md §Don't).
 */
export function EndpointCard({ spec, className }: { spec: EndpointSpec; className?: string }) {
  const { method, path, auth, rateLimit, summary, params, request, response, note } = spec;
  const restricted = auth !== "public";

  return (
    <Card id={spec.id} className={cn("scroll-mt-24 overflow-hidden", className)}>
      <div className="flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            className={cn(
              "inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-label font-semibold",
              METHOD_TONES[method],
            )}
          >
            {method}
          </span>
          <code className="min-w-0 break-all font-mono text-body font-medium text-ink">{path}</code>
          <span className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-sm bg-sunken px-2 py-0.5 text-label font-medium text-ink-secondary">
              {restricted ? <LockIcon size={14} /> : null}
              {AUTH_LABELS[auth]}
            </span>
            {rateLimit ? (
              <span className="tabular text-label text-ink-muted">{rateLimit}</span>
            ) : null}
          </span>
        </div>
        <p className="text-body text-ink-secondary">{summary}</p>
      </div>

      {params && params.length > 0 ? <ParamsBlock params={params} /> : null}

      {request ? (
        <div className="border-t border-line-inner px-5 pb-5 pt-4">
          <CodeBlock code={request} label={spec.requestLabel ?? "Example request"} className="mt-0" />
        </div>
      ) : null}

      {response ? (
        <div className="border-t border-line-inner px-5 pb-5 pt-4">
          <CodeBlock code={response} label={spec.responseLabel ?? "Example response"} className="mt-0" />
        </div>
      ) : null}

      {note ? (
        <div className="border-t border-line-inner px-5 py-4 text-label text-ink-muted">{note}</div>
      ) : null}
    </Card>
  );
}

function ParamsBlock({ params }: { params: EndpointParam[] }) {
  return (
    <div className="border-t border-line-inner">
      <p className="px-5 pt-4 text-label font-semibold text-ink">Parameters</p>

      {/* Desktop */}
      <table className="mt-1 hidden w-full border-collapse text-left sm:table">
        <thead>
          <tr className="text-label text-ink-muted">
            <th scope="col" className="px-5 py-2 font-medium">
              Parameter
            </th>
            <th scope="col" className="px-5 py-2 font-medium">
              Type
            </th>
            <th scope="col" className="px-5 py-2 font-medium">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {params.map((param) => (
            <tr key={param.name} className="border-t border-line-inner align-top">
              <td className="px-5 py-2.5">
                <span className="font-mono text-label text-ink">{param.name}</span>
                <RequiredMark required={param.required} />
              </td>
              <td className="px-5 py-2.5 text-label text-ink-secondary">{param.type}</td>
              <td className="px-5 py-2.5 text-label text-ink-secondary">{param.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Phone */}
      <ul className="mt-1 divide-y divide-line-inner sm:hidden">
        {params.map((param) => (
          <li key={param.name} className="px-5 py-3">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-mono text-label text-ink">{param.name}</span>
              <span className="text-micro text-ink-muted">{param.type}</span>
              <RequiredMark required={param.required} />
            </div>
            <p className="mt-1 text-label text-ink-secondary">{param.notes}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RequiredMark({ required }: { required?: boolean }) {
  if (required === undefined) return null;
  return (
    <span
      className={cn(
        "ml-2 text-micro font-medium",
        required ? "text-official-mid" : "text-ink-muted",
      )}
    >
      {required ? "required" : "optional"}
    </span>
  );
}
