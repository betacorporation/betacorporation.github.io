import { useState, type FormEvent } from "react";
import { BUDGETS, COUNTRY_CODES, SERVICES, leadSchema, sendLead } from "@/lib/lead-form";
import { EMAIL, whatsappLink } from "@/lib/site-contact";

const FLAGS: Record<(typeof COUNTRY_CODES)[number], string> = {
  "+254": "🇰🇪", "+256": "🇺🇬", "+255": "🇹🇿", "+250": "🇷🇼", "+234": "🇳🇬", "+27": "🇿🇦", "+44": "🇬🇧", "+1": "🇺🇸",
};

const field =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";
const errorText = "text-[11px]! text-destructive! mt-1!";

type Status = "idle" | "sending" | "sent" | "failed";

export function QuoteForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sentName, setSentName] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get("_honey")) return; // bots fill the hidden field
    const parsed = leadSchema.safeParse({
      name: data.get("name") ?? "",
      email: data.get("email") ?? "",
      countryCode: data.get("countryCode") ?? "+254",
      phone: data.get("phone") ?? "",
      company: data.get("company") ?? "",
      service: data.get("service") ?? "",
      budget: data.get("budget") ?? "",
      message: data.get("message") ?? "",
      terms: data.get("terms") === "on",
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      await sendLead(parsed.data);
      setSentName(parsed.data.name.split(" ")[0] ?? "");
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("failed");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex! flex-col! items-center! justify-center! text-center! py-10! gap-3!" role="status">
        <div className="flex! h-14! w-14! items-center! justify-center! rounded-full! bg-primary/10! text-primary!">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <h3 className="text-xl! font-bold! text-foreground!">Thank you{sentName ? `, ${sentName}` : ""}!</h3>
        <p className="text-sm! text-muted-foreground! max-w-xs!">We've received your details and will get back to you shortly.</p>
        <button type="button" className="text-xs! text-primary! hover:underline!" onClick={() => setStatus("idle")}>Send another request</button>
      </div>
    );
  }

  const sending = status === "sending";
  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <input type="text" name="_honey" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: "none" }} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <input className={field} placeholder="Full name*" name="name" autoComplete="name" maxLength={100} aria-label="Full name" aria-invalid={!!errors["name"]} />
          {errors["name"] && <p className={errorText}>{errors["name"]}</p>}
        </div>
        <div>
          <input className={field} placeholder="Email*" type="email" name="email" autoComplete="email" maxLength={255} aria-label="Email" aria-invalid={!!errors["email"]} />
          {errors["email"] && <p className={errorText}>{errors["email"]}</p>}
        </div>
      </div>
      <div>
        <div className="flex gap-2">
          <select className={`${field} w-[100px]! shrink-0! px-2!`} name="countryCode" defaultValue="+254" aria-label="Country code">
            {COUNTRY_CODES.map(code => <option key={code} value={code}>{FLAGS[code]} {code}</option>)}
          </select>
          <input className={field} placeholder="Phone number*" type="tel" name="phone" autoComplete="tel-national" maxLength={15} aria-label="Phone number" aria-invalid={!!errors["phone"]} />
        </div>
        {errors["phone"] && <p className={errorText}>{errors["phone"]}</p>}
      </div>
      <input className={field} placeholder="Company" name="company" autoComplete="organization" maxLength={120} aria-label="Company" />
      <div className="grid grid-cols-2 gap-3">
        <select className={field} name="service" defaultValue="" aria-label="Service interested in">
          <option value="">Service interested in (optional)</option>
          {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={field} name="budget" defaultValue="" aria-label="Budget range">
          <option value="">Budget range (optional)</option>
          {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <div>
        <textarea className={`${field} h-auto! min-h-[100px]! resize-none!`} placeholder="Tell us about your project*" name="message" maxLength={2000} aria-label="Tell us about your project" aria-invalid={!!errors["message"]} />
        {errors["message"] && <p className={errorText}>{errors["message"]}</p>}
      </div>
      <div>
        <label className="flex items-start gap-2 text-xs text-muted-foreground leading-snug cursor-pointer">
          <input type="checkbox" name="terms" className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]" />
          <span>I accept the <a className="text-primary hover:underline" href="/terms" target="_blank">Terms &amp; Conditions</a> and <a className="text-primary hover:underline" href="/privacy" target="_blank">Privacy Policy</a>.</span>
        </label>
        {errors["terms"] && <p className={errorText}>{errors["terms"]}</p>}
      </div>
      {status === "failed" && (
        <p className="text-xs! text-destructive! text-center!" role="alert">
          Sorry, your request didn't go through. Please try again, or <a className="underline!" href={whatsappLink("Hi, I'd like a quote.")} target="_blank" rel="noopener noreferrer">message us on WhatsApp</a>.
        </p>
      )}
      <button className="inline-flex items-center justify-center gap-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-md px-8 w-full group whitespace-nowrap disabled:pointer-events-none" type="submit" disabled={sending}>
        {sending ? "Sending…" : "Submit"}
        {!sending && <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 pointer-events-none shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>}
      </button>
      <a className="w-full flex items-center justify-center text-xs text-muted-foreground hover:text-primary transition-colors gap-1.5" href={`mailto:${EMAIL}?subject=${encodeURIComponent("Quote request")}`}>
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg> Prefer email? Send it to us directly
      </a>
      <p className="text-[11px] text-center text-muted-foreground">Your details are 100% secure. Zero spam.</p>
    </form>
  );
}
