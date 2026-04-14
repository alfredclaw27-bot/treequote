import { Resend } from "resend";
import seedContractors from "@/data/contractors-seed.json";
import type { Lead } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");

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

// Check if a contractor covers a given zip code
function contractorCovers(c: SeedContractor, zip: string): boolean {
  return c.service_area.includes(zip) && c.approved;
}

// Check if contractor does at least one of the service types
function contractorMatchesSpecialty(c: SeedContractor, serviceTypes: string[]): boolean {
  if (!serviceTypes.length) return true;
  return serviceTypes.some((st) => c.specialties.includes(st));
}

// Score how well a contractor matches (0-100)
function matchScore(c: SeedContractor, serviceTypes: string[]): number {
  let score = 50; // base
  const matched = serviceTypes.filter((st) => c.specialties.includes(st));
  score += matched.length * 20; // +20 per matching specialty
  if (matched.length === serviceTypes.length) score += 15; // full match bonus
  return Math.min(score, 100);
}

// Extract city/state hints from address
function extractLocationHints(address: string): string[] {
  const lower = address.toLowerCase();
  const cities = ["atlanta", "marietta", "roswell", "decatur", "alpharetta", "sandy springs", "kennesaw", "smyrna", "dunwoody", "lawrenceville", "gwinnett"];
  return cities.filter((c) => lower.includes(c));
}

export interface NotificationResult {
  sent: number;
  skipped: number;
  errors: string[];
  contractors: string[];
}

export async function sendLeadAlerts(lead: Lead): Promise<NotificationResult> {
  const result: NotificationResult = { sent: 0, skipped: 0, errors: [], contractors: [] };

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_placeholder") {
    // Stub mode: just return matched contractors
    const matched = getMatchedContractors(lead);
    result.skipped = matched.length;
    result.contractors = matched.map((c) => c.email);
    result.errors.push("RESEND_API_KEY not configured — stub mode, no emails sent");
    console.log("[LeadAlert Stub] Would notify:", result.contractors);
    return result;
  }

  const matched = getMatchedContractors(lead);
  if (matched.length === 0) {
    result.errors.push("No contractors found matching this lead's location/service");
    return result;
  }

  const contractorsToNotify = matched.slice(0, 10); // max 10

  const serviceLabel = lead.service_types?.join(", ") ?? "Tree Service";
  const aiSummary = lead.analysis_data
    ? `${lead.analysis_data.species} · ${lead.analysis_data.heightEstimate} · ${lead.analysis_data.healthStatus}${lead.analysis_data.accessNotes ? ` · ${lead.analysis_data.accessNotes}` : ""}`
    : "AI analysis pending";
  const priceRange = lead.estimated_price
    ? `$${lead.estimated_price.low}–$${lead.estimated_price.high}`
    : "Quote TBD";
  const analysisDetails = lead.analysis_data
    ? `Health: ${lead.analysis_data.healthStatus}\nComplexity: ${lead.analysis_data.estimatedJobComplexity ?? "standard"}\n${lead.analysis_data.visibleDamage && lead.analysis_data.visibleDamage !== "none" ? `Damage: ${lead.analysis_data.visibleDamage}\n` : ""}${lead.analysis_data.obstacles?.length ? `Obstacles: ${lead.analysis_data.obstacles.join(", ")}\n` : ""}`
    : "";

  for (const contractor of contractorsToNotify) {
    const emailHtml = buildEmailHtml({ lead, contractor, serviceLabel, aiSummary, priceRange, analysisDetails });

    try {
      const { error } = await resend.emails.send({
        from: "TreeQuote Alerts <alerts@treequote.ai>",
        to: contractor.email,
        subject: `🪵 New Lead${lead.address ? ` — ${lead.address.split(",")[0]}` : ""} [${serviceLabel}]`,
        html: emailHtml,
        replyTo: "leads@treequote.ai",
      });

      if (error) {
        result.errors.push(`Failed to send to ${contractor.email}: ${error.message}`);
      } else {
        result.sent++;
        result.contractors.push(contractor.email);
      }
    } catch (err) {
      result.errors.push(`Exception sending to ${contractor.email}: ${String(err)}`);
    }
  }

  return result;
}

export function getMatchedContractors(lead: Lead): SeedContractor[] {
  const contractors = seedContractors as SeedContractor[];
  const zip = extractZip(lead.address ?? "");
  const locationHints = extractLocationHints(lead.address ?? "");

  const scored = contractors
    .filter((c) => {
      if (!c.approved) return false;
      // Must cover the zip OR a city mentioned in address
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
  contractor: SeedContractor;
  serviceLabel: string;
  aiSummary: string;
  priceRange: string;
  analysisDetails: string;
}

function buildEmailHtml({ lead, contractor, serviceLabel, aiSummary, priceRange, analysisDetails }: EmailParams): string {
  const photoUrl = lead.photo_url || "";
  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/contractor/quote/${lead.id}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F9FAFB; margin: 0; padding: 24px; color: #111827;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #16A34A, #15803D); padding: 24px 32px;">
      <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 1px;">New Lead Alert</p>
      <h1 style="margin: 8px 0 0 0; color: white; font-size: 24px;">🌳 TreeQuote</h1>
    </div>

    <!-- Lead Photo -->
    ${photoUrl ? `<img src="${photoUrl}" alt="Tree photo" style="width: 100%; max-height: 280px; object-fit: cover; display: block;">` : ""}

    <!-- Body -->
    <div style="padding: 28px 32px;">
      <p style="font-size: 15px; color: #6B7280; margin: 0 0 4px 0;">Hi ${contractor.name.split(" ")[0]},</p>
      <p style="font-size: 15px; color: #374151; margin: 0 0 20px 0;">A new tree service lead has been submitted in your area. Is this something you can help with?</p>

      <!-- Service Badge -->
      <div style="display: inline-block; background: #F3F4F6; border-radius: 8px; padding: 8px 16px; margin-bottom: 20px;">
        <span style="font-size: 20px; margin-right: 8px;">🌲</span>
        <span style="font-weight: 700; font-size: 16px; color: #111827; text-transform: capitalize;">${serviceLabel}</span>
      </div>

      <!-- Details Grid -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px; color: #6B7280; width: 120px;">Location</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 14px; font-weight: 600; color: #111827;">${lead.address ?? "—"}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px; color: #6B7280;">AI Analysis</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 14px; color: #374151;">${aiSummary}</td>
        </tr>
        ${analysisDetails ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px; color: #6B7280;">Details</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px; color: #374151; white-space: pre-line;">${analysisDetails}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px; color: #6B7280;">AI Est. Range</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 14px; font-weight: 700; color: #16A34A;">${priceRange}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-size: 13px; color: #6B7280;">Lead ID</td>
          <td style="padding: 10px 0; font-size: 13px; color: #9CA3AF; font-family: monospace;">${lead.id?.substring(0, 8).toUpperCase()}</td>
        </tr>
      </table>

      <!-- CTA Button -->
      <a href="${reviewUrl}" style="display: block; background: #F59E0B; color: white; text-align: center; padding: 16px 24px; border-radius: 12px; font-weight: 700; font-size: 16px; text-decoration: none; margin-bottom: 16px;">Submit Your Quote →</a>

      <!-- Note -->
      <p style="font-size: 12px; color: #9CA3AF; margin: 0;">
        This lead was submitted on TreeQuote. No subscription required to respond — 
        contractors submit quotes directly to customers. You were matched based on your service area (${contractor.city}, ${contractor.state}).
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #F9FAFB; padding: 16px 32px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
        To stop receiving these alerts, email unsubscribe@treequote.ai<br>
        © 2026 TreeQuote · <a href="https://treequote.ai" style="color: #16A34A;">treequote.ai</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}
