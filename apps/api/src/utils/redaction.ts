const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi;
const CARD = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
const AADHAAR = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b(?![\s-]?\d{4})/g;
const MOBILE = /(?<!\d)(?:\+91[\s-]?)?\d{5}[\s-]?\d{5}(?!\d)/g;

const REDACTED = "[REDACTED]";

export function redactText(text: string): string {
  return text
    .replace(EMAIL, REDACTED)
    .replace(CARD, REDACTED)
    .replace(AADHAAR, REDACTED)
    .replace(MOBILE, REDACTED);
}