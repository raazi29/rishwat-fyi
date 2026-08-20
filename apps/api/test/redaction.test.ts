import { describe, it, expect } from "vitest";
import { redactText } from "../src/utils/redaction.js";

describe("redactText", () => {
  it("redacts a 12-digit Aadhaar number", () => {
    expect(redactText("my aadhaar is 123456789012")).toBe("my aadhaar is [REDACTED]");
  });

  it("redacts a 10-digit mobile number with +91 prefix", () => {
    expect(redactText("Call +91 98765 43210")).toBe("Call [REDACTED]");
  });

  it("redacts an email address", () => {
    expect(redactText("mail me at user@example.com now")).toBe("mail me at [REDACTED] now");
  });

  it("redacts a plain 16-digit card number", () => {
    expect(redactText("card 1234567890123456")).toBe("card [REDACTED]");
  });

  it("redacts a grouped 4-4-4-4 card number", () => {
    expect(redactText("card 1234 5678 9012 3456 end")).toBe("card [REDACTED] end");
  });

  it("leaves plain prose with digits untouched", () => {
    expect(redactText("I went to the office on 5 visits")).toBe("I went to the office on 5 visits");
  });

  it("fully redacts a 12-digit Aadhaar rather than half of it", () => {
    const out = redactText("aadhaar 123456789012 done");
    expect(out).toBe("aadhaar [REDACTED] done");
    expect(out).not.toContain("1234");
  });

  it("redacts a grouped 4-4-4 Aadhaar number", () => {
    expect(redactText("aadhaar 1234 5678 9012 ok")).toBe("aadhaar [REDACTED] ok");
  });

  it("replaces with exactly [REDACTED]", () => {
    expect(redactText("email user@example.com")).toBe("email [REDACTED]");
  });
});