import { Resend } from "resend";
import seedContractors from "@/data/contractors-seed.json";
import { createServiceClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";
import { formatDetailsSummary, maskAddressToCity } from "@/lib/details";
import type { Lead } from "@/types";

function getResendClient() {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_placeholder") return null;
  return new Resend(process.env.RESEND_API_KEY);
}

interface MatchableContractor {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  service_area: string[];
  specialties: string[];
  city?: string;
  state?: string;
  approved: boolean;
}

interface SeedContractor {
  name: string;
  email: string;
  phone: string;
  service_area: string[];
  specialties: string[];
  city: string;
  state: string;
  approved: boolean;
}

// Extract zip code from an address string
function extractZip(address: string): string | null {
  const match = address.match(/\b\d{5}(?:-\d{4})?\b/);
  return match ? match[0].substring(0, 5) : null;
}

function contractorCovers(c: MatchableContractor, zip: string): boolean {
  return c.service_area.includes(zip) && c.approved;
}

function contractorMatchesSpecialty(c: MatchableContractor, serviceTypes: string[]): boolean {
  if (!serviceTypes.length) return true;
  return serviceTypes.some((st) => c.specialties.includes(st));
}

function matchScore(c: MatchableContractor, serviceTypes: string[]): number {
  let score = 50; // base
  const matched = serviceTypes.filter((st) => c.specialties.includes(st));
  score += matched.length * 20;
  if (matched.length === serviceTypes.length) score += 15;
  return Math.min(score, 100);
}

// Extract city/state hints from address (best-effort, works for any region)
function extractLocationHints(address: string, knownCities: string[]): string[] {
  const lower = address.toLowerCase();
  return knownCities.filter((c) => lower.includes(c));
}

export interface NotificationResult {
  sent: number;
  skipped: number;
  errors: string[];
  contractors: string[];
  /** Full matched-contractor records (name/email/phone) — cheap to reuse for the admin new-lead email instead of re-querying. */
  matchedContractors: MatchableContractor[];
}

/**
 * Records one row per attempted contractor notification in
 * `tq_lead_notifications`, so admins can see who was contacted, when, and
 * with what result — including in stub mode (Supabase up, Resend not).
 * Best-effort: logging failures never block the actual alert flow.
 */
async function logNotification(params: {
  leadId: string;
  contractor: MatchableContractor;
  status: "sent" | "failed" | "stub";
}) {
  try {
    const supabase = await createServiceClient();
    await supabase.from("tq_lead_notifications").insert({
      lead_id: params.leadId,
      contractor_name: params.contractor.name,
      contractor_email: params.contractor.email,
      contractor_phone: params.contractor.phone ?? null,
      channel: "email",
      status: params.status,
    });
  } catch (err) {
    console.error("[LeadAlert] Failed to log notification:", err);
  }
}

export async function sendLeadAlerts(lead: Lead): Promise<NotificationResult> {
  const result: NotificationResult = { sent: 0, skipped: 0, errors: [], contractors: [], matchedContractors: [] };
  const resend = getResendClient();

  const matched = await getMatchedContractors(lead);
  if (matched.length === 0) {
    result.errors.push("No contractors found matching this lead's location/service");
    return result;
  }

  const contractorsToNotify = matched.slice(0, siteConfig.maxContractorsPerLead * 3); // notify a wider pool than can unlock
  result.matchedContractors = contractorsToNotify;

  if (!resend) {
    // Stub mode: just report matched contractors, don't crash without RESEND_API_KEY
    result.skipped = contractorsToNotify.length;
    result.contractors = contractorsToNotify.map((c) => c.email);
    result.errors.push("RESEND_API_KEY not configured — stub mode, no emails sent");
    console.log("[LeadAlert Stub] Would notify:", result.contractors);
    await Promise.all(
      contractorsToNotify.map((contractor) => logNotification({ leadId: lead.id, contractor, status: "stub" }))
    );
    return result;
  }

  const serviceLabel = (lead.service_types ?? [])
    .map((id) => siteConfig.serviceTypes.find((s) => s.id === id)?.label ?? id)
    .join(", ") || "New job";
  const detailsSummary = lead.details ? formatDetailsSummary(lead.details).join("\n") : "";
  const cityLabel = maskAddressToCity(lead.address);

  for (const contractor of contractorsToNotify) {
    const emailHtml = buildEmailHtml({ lead, contractor, serviceLabel, detailsSummary });

    try {
      const { error } = await resend.emails.send({
        from: `${siteConfig.brand.name} Alerts <${process.env.RESEND_FROM_EMAIL || siteConfig.emailCopy.alertsFromEmail}>`,
        to: contractor.email,
        subject: `${siteConfig.emailCopy.leadAlertSubjectPrefix}${cityLabel ? ` — ${cityLabel}` : ""} [${serviceLabel}]`,
        html: emailHtml,
        replyTo: siteConfig.emailCopy.replyToEmail,
      });

      if (error) {
        result.errors.push(`Failed to send to ${contractor.email}: ${error.message}`);
        await logNotification({ leadId: lead.id, contractor, status: "failed" });
      } else {
        result.sent++;
        result.contractors.push(contractor.email);
        await logNotification({ leadId: lead.id, contractor, status: "sent" });
      }
    } catch (err) {
      result.errors.push(`Exception sending to ${contractor.email}: ${String(err)}`);
      await logNotification({ leadId: lead.id, contractor, status: "failed" });
    }
  }

  return result;
}

/**
 * Matches contractors to a lead by service area (zip/city) + specialty.
 * Prefers real signed-up contractors (tq_contractors); falls back to the
 * seed dataset in `data/contractors-seed.json` when there are no approved
 * real contractors yet (fresh installs / local demos).
 */
export async function getMatchedContractors(lead: Lead): Promise<MatchableContractor[]> {
  const zip = extractZip(lead.address ?? "");
  let pool: MatchableContractor[] = [];

  try {
    const supabase = await createServiceClient();
    const { data } = await supabase.from("tq_contractors").select("*").eq("approved", true);
    if (data && data.length > 0) {
      pool = data.map((c) => ({
        id: c.id,
        name: c.business_name,
        email: c.email,
        phone: c.phone,
        service_area: c.service_area ?? [],
        specialties: c.specialties ?? [],
        approved: c.approved,
      }));
    }
  } catch {
    // Supabase not configured — fall through to seed data
  }

  if (pool.length === 0) {
    pool = (seedContractors as SeedContractor[]).map((c) => ({ ...c }));
  }

  const knownCities = Array.from(
    new Set(pool.flatMap((c) => (c.city ? [c.city.toLowerCase()] : [])))
  );
  const locationHints = extractLocationHints(lead.address ?? "", knownCities);

  const scored = pool
    .filter((c) => {
      if (!c.approved) return false;
      const coversZip = zip && contractorCovers(c, zip);
      const coversCity = locationHints.some((hint) =>
        c.service_area.some((sa) => sa.toLowerCase().includes(hint) || hint.includes(sa.toLowerCase()))
      );
      if (!coversZip && !coversCity) return false;
      return contractorMatchesSpecialty(c, lead.service_types ?? []);
    })
    .map((c) => ({ contractor: c, score: matchScore(c, lead.service_types ?? []) }))
    .sort((a, b) => b.score - a.score);

  return scored.map((s) => s.contractor);
}

interface EmailParams {
  lead: Lead;
  contractor: MatchableContractor;
  serviceLabel: string;
  detailsSummary: string;
}

function buildEmailHtml({ lead, contractor, serviceLabel, detailsSummary }: EmailParams): string {
  const photoUrl = lead.photo_url || "";
  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/contractor/quote/${lead.id}`;
  const { brand, theme } = siteConfig;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F9FAFB; margin: 0; padding: 24px; color: #111827;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark}); padding: 24px 32px;">
      <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 1px;">New Lead Alert</p>
      <h1 style="margin: 8px 0 0 0; color: white; font-size: 24px;">${brand.emoji} ${brand.name}</h1>
    </div>

    <!-- Lead Photo -->
    ${photoUrl ? `<img src="${photoUrl}" alt="Job photo" style="width: 100%; max-height: 280px; object-fit: cover; display: block;">` : ""}

    <!-- Body -->
    <div style="padding: 28px 32px;">
      <p style="font-size: 15px; color: #6B7280; margin: 0 0 4px 0;">Hi ${contractor.name.split(" ")[0]},</p>
      <p style="font-size: 15px; color: #374151; margin: 0 0 20px 0;">A new lead has been submitted in your area. Is this something you can help with?</p>

      <!-- Service Badge -->
      <div style="display: inline-block; background: #F3F4F6; border-radius: 8px; padding: 8px 16px; margin-bottom: 20px;">
        <span style="font-weight: 700; font-size: 16px; color: #111827;">${serviceLabel}</span>
      </div>

      <!-- Details Grid -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px; color: #6B7280; width: 120px;">Location</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 14px; font-weight: 600; color: #111827;">${maskAddressToCity(lead.address) || "—"} <span style="font-weight:400;color:#9CA3AF;">(exact address revealed after unlock)</span></td>
        </tr>
        ${detailsSummary ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px; color: #6B7280;">Details</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px; color: #374151; white-space: pre-line;">${detailsSummary}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 10px 0; font-size: 13px; color: #6B7280;">Lead ID</td>
          <td style="padding: 10px 0; font-size: 13px; color: #9CA3AF; font-family: monospace;">${lead.id?.substring(0, 8).toUpperCase()}</td>
        </tr>
      </table>

      <!-- CTA Button -->
      <a href="${reviewUrl}" style="display: block; background: ${theme.accent}; color: white; text-align: center; padding: 16px 24px; border-radius: 12px; font-weight: 700; font-size: 16px; text-decoration: none; margin-bottom: 16px;">Unlock & Submit Your Quote →</a>

      <!-- Note -->
      <p style="font-size: 12px; color: #9CA3AF; margin: 0;">
        This lead was submitted on ${brand.name}. You were matched based on your service area${contractor.city ? ` (${contractor.city}${contractor.state ? `, ${contractor.state}` : ""})` : ""}.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #F9FAFB; padding: 16px 32px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
        Questions? Email ${brand.supportEmail}<br>
        © 2026 ${brand.name}
      </p>
    </div>
  </div>
</body>
</html>`;
}
