import { z } from "zod";
import { BRAND, EMAIL } from "@/lib/site-contact";

// Quote-popup submissions are relayed to the owner's inbox by FormSubmit (free, no backend),
// because the site is also served as static files on GitHub Pages where no server code runs.
export const LEAD_FORM_ENDPOINT = `https://formsubmit.co/ajax/${EMAIL}`;

export const COUNTRY_CODES = ["+254", "+256", "+255", "+250", "+234", "+27", "+44", "+1"] as const;
export const SERVICES = [
  "Website Design & Development",
  "Custom Web Application",
  "Digital Marketing",
  "Creative / BTL Media",
  "E-commerce Store",
  "Web Hosting & Domains",
  "Other",
] as const;
export const BUDGETS = [
  "Under KES 60,000",
  "KES 60,000 – 130,000",
  "KES 130,000 – 350,000",
  "KES 350,000+",
  "Not sure yet",
] as const;

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(100, "Name is too long"),
  email: z.string().trim().email("Please enter a valid email").max(255, "Email is too long"),
  countryCode: z.enum(COUNTRY_CODES),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9\s-]{6,15}$/, "Please enter a valid phone number"),
  company: z.string().trim().max(120, "Company name is too long").optional().default(""),
  service: z.union([z.enum(SERVICES), z.literal("")]).optional().default(""),
  budget: z.union([z.enum(BUDGETS), z.literal("")]).optional().default(""),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(2000, "Message is too long"),
  terms: z.literal(true, { errorMap: () => ({ message: "Please accept the terms to continue" }) }),
});

export type LeadInput = z.input<typeof leadSchema>;
export type Lead = z.output<typeof leadSchema>;

/** Fields sent to FormSubmit; the leading-underscore keys are FormSubmit settings. */
export function leadPayload(lead: Lead) {
  return {
    _subject: `New quote request from ${lead.name} — ${BRAND} website`,
    _template: "table",
    _captcha: "false",
    _replyto: lead.email,
    Name: lead.name,
    Email: lead.email,
    Phone: `${lead.countryCode} ${lead.phone.replace(/^0+/, "")}`,
    Company: lead.company || "—",
    Service: lead.service || "Not specified",
    Budget: lead.budget || "Not specified",
    Message: lead.message,
  };
}

export async function sendLead(lead: Lead, fetcher: typeof fetch = fetch) {
  const response = await fetcher(LEAD_FORM_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(leadPayload(lead)),
  });
  const body = (await response.json().catch(() => ({}))) as { success?: string | boolean; message?: string };
  if (!response.ok || String(body.success) !== "true") {
    throw new Error(body.message || `Form service error (${response.status})`);
  }
}
