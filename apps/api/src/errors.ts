// Typed application error. The app-level error handler (see app.ts) maps these
// to a JSON body `{ error: { code, message, details? } }` with `status`.
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message = "Bad request", details?: unknown): AppError =>
  new AppError(400, "bad_request", message, details);

export const unauthorized = (message = "Unauthorized", details?: unknown): AppError =>
  new AppError(401, "unauthorized", message, details);

export const forbidden = (message = "Forbidden", details?: unknown): AppError =>
  new AppError(403, "forbidden", message, details);

export const notFound = (message = "Not found", details?: unknown): AppError =>
  new AppError(404, "not_found", message, details);

export const conflict = (message = "Conflict", details?: unknown): AppError =>
  new AppError(409, "conflict", message, details);

export const tooMany = (message = "Too many requests", retryAfterSeconds?: number): AppError =>
  new AppError(
    429,
    "rate_limited",
    message,
    retryAfterSeconds !== undefined ? { retryAfterSeconds } : undefined,
  );
