import { describe, expect, it, vi } from "vitest";
import { LEAD_FORM_ENDPOINT, leadPayload, leadSchema, sendLead } from "./lead-form";

const valid = {
  name: "Jane Wanjiku",
  email: "jane@example.com",
  countryCode: "+254",
  phone: "0712 345678",
  message: "I need a website for my salon.",
  terms: true,
} as const;

describe("quote popup form", () => {
  it("delivers submissions to beta.corporation11@gmail.com", () => {
    expect(LEAD_FORM_ENDPOINT).toBe("https://formsubmit.co/ajax/beta.corporation11@gmail.com");
  });

  it("requires name, email, phone, message and accepted terms", () => {
    expect(leadSchema.safeParse(valid).success).toBe(true);
    for (const key of ["name", "email", "phone", "message"] as const) {
      expect(leadSchema.safeParse({ ...valid, [key]: "" }).success).toBe(false);
    }
    expect(leadSchema.safeParse({ ...valid, terms: false }).success).toBe(false);
    expect(leadSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("sends the client's name and full phone number, with replies going to the client", () => {
    const payload = leadPayload(leadSchema.parse(valid));
    expect(payload.Name).toBe("Jane Wanjiku");
    expect(payload.Phone).toBe("+254 712 345678");
    expect(payload._replyto).toBe("jane@example.com");
  });

  it("reports a failure when the form service rejects the submission", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: "false", message: "nope" }), { status: 200 }));
    await expect(sendLead(leadSchema.parse(valid), fetcher)).rejects.toThrow("nope");
  });
});
