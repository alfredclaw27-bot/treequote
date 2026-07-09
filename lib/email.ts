import { Resend } from "resend";
import { siteConfig } from "@/config/site";
import { formatDetailsSummary, maskAddressToCity } from "@/lib/details";
import type { Lead } from "@/types";

function fromEmail() {
  return `${siteConfig.emailCopy.fromName} <${siteConfig.emailCopy.fromEmail}>`;
}

function getResend() {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_placeholder") return null;
  return new Resend(process.env.RESEND_API_KEY);
}

async function send(params: { to: string; subject: string; html: string; text?: string }) {
  const resend = getResend();
  if (!resend) {
    console.warn("[Resend] Not configured — skipping email:", params.subject);
    return;
  }
  await resend.emails.send({ from: fromEmail(), ...params });
}

function appUrl(path = "") {
  return `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${path}`;
}

/** Send contractor application confirmation email */
export async function sendContractorApplicationEmail({
  to,
  businessName,
}: {
  to: string;
  businessName: string;
}) {
  const { name: APP_NAME, emoji, supportEmail } = siteConfig.brand;
  await send({
    to,
    subject: siteConfig.emailCopy.contractorApplicationSubject,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="font-size:28px;margin:0;">${emoji} ${APP_NAME}</h1>
  </div>
  <p style="font-size:16px;">Hi ${businessName},</p>
  <p style="font-size:16px;">Thanks for applying to join the <strong>${APP_NAME}</strong> contractor network! We're reviewing your application and will email you within <strong>24–48 hours</strong> once approved.</p>
  <div style="background:#f8fafc;border-radius:12px;padding:16px;margin:20px 0;">
    <p style="margin:0 0 4px;font-size:13px;color:#64748b;">What happens next?</p>
    <ol style="margin:8px 0 0;padding-left:20px;font-size:14px;color:#475569;line-height:1.8;">
      <li>We review your business info & service area</li>
      <li>You receive an approval email with login details</li>
      <li>Log in to your dashboard and start receiving leads!</li>
    </ol>
  </div>
  <p style="font-size:16px;">Questions? Reply to this email or contact us anytime.</p>
  <p style="font-size:14px;color:#64748b;margin-top:24px;">— The ${APP_NAME} Team</p>
</body>
</html>`,
    text: `Hi ${businessName}, Thanks for applying to ${APP_NAME}! We're reviewing your application and will email you within 24-48 hours once approved. Visit ${appUrl("/contractor/login")} to check your status. — The ${APP_NAME} Team (${supportEmail})`,
  });
}

/** Send notification to approved contractor */
export async function sendContractorApprovedEmail({
  to,
  businessName,
  email,
}: {
  to: string;
  businessName: string;
  email: string;
}) {
  const { name: APP_NAME, emoji } = siteConfig.brand;
  await send({
    to,
    subject: siteConfig.emailCopy.contractorApprovedSubject,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="font-size:28px;margin:0;">${emoji} ${APP_NAME}</h1>
    <p style="color:${siteConfig.theme.primaryDark};font-size:18px;font-weight:700;margin:8px 0 0;">You're approved!</p>
  </div>
  <p style="font-size:16px;">Hi ${businessName},</p>
  <p style="font-size:16px;">Great news — your contractor application has been approved!</p>
  <p style="font-size:16px;">You can now log in to your dashboard and start receiving qualified leads from customers in your area.</p>
  <a href="${appUrl("/contractor/login")}"
     style="display:block;text-align:center;background:${siteConfig.theme.primary};color:white;text-decoration:none;font-weight:700;
            padding:14px 24px;border-radius:12px;font-size:16px;margin:20px 0;">
    Log In to My Dashboard
  </a>
  <div style="background:#f8fafc;border-radius:12px;padding:16px;margin:20px 0;font-size:14px;color:#475569;">
    <p style="margin:0 0 8px;font-weight:600;">Your login:</p>
    <p style="margin:0;"><strong>Email:</strong> ${email}</p>
    <p style="margin:4px 0 0;"><strong>Password:</strong> Use the password you set during application</p>
  </div>
  <p style="font-size:13px;color:#94a3b8;text-align:center;margin-top:24px;">
    Questions? Email ${siteConfig.brand.supportEmail}
  </p>
</body>
</html>`,
    text: `Hi ${businessName}, Great news — you're approved! Log in at ${appUrl("/contractor/login")} with your email ${email} to start receiving leads. — ${APP_NAME}`,
  });
}

/** Send lead submission confirmation to customer */
export async function sendCustomerLeadConfirmationEmail({
  to,
  customerName,
  leadId,
  serviceTypes,
  address,
}: {
  to: string;
  customerName: string;
  leadId: string;
  serviceTypes: string[];
  address: string;
}) {
  const { name: APP_NAME, emoji } = siteConfig.brand;
  const serviceLabels = serviceTypes
    .map((id) => siteConfig.serviceTypes.find((s) => s.id === id)?.label ?? id)
    .join(", ");

  await send({
    to,
    subject: siteConfig.emailCopy.customerConfirmationSubject,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="font-size:28px;margin:0;">${emoji} ${APP_NAME}</h1>
    <p style="color:${siteConfig.theme.primaryDark};font-size:16px;font-weight:600;margin:8px 0 0;">Request received!</p>
  </div>
  <p style="font-size:16px;">Hi ${customerName},</p>
  <p style="font-size:16px;">We've received your request and contractors in your area have been notified.</p>
  <div style="background:#f8fafc;border-radius:12px;padding:16px;margin:20px 0;">
    <p style="margin:0 0 4px;font-size:12px;color:#64748b;">Your request</p>
    <p style="margin:0;font-size:14px;font-weight:600;">${serviceLabels}</p>
    <p style="margin:4px 0 0;font-size:13px;color:#64748b;">📍 ${address}</p>
    <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Lead ID: ${leadId.slice(0, 8).toUpperCase()}</p>
  </div>
  <p style="font-size:15px;"><strong>Expect quotes within 24 hours.</strong> You can track them here:</p>
  <a href="${appUrl(`/customer/quotes/${leadId}`)}"
     style="display:block;text-align:center;background:${siteConfig.theme.primary};color:white;text-decoration:none;font-weight:700;
            padding:14px 24px;border-radius:12px;font-size:15px;margin:16px 0;">
    View My Quotes →
  </a>
  <a href="${appUrl(`/customer/setup?email=${encodeURIComponent(to)}&leadId=${leadId}`)}"
     style="display:block;text-align:center;background:white;color:${siteConfig.theme.primaryDark};text-decoration:none;font-weight:600;
            padding:12px 24px;border-radius:12px;font-size:14px;margin:0 0 16px;border:2px solid ${siteConfig.theme.primary};">
    ${siteConfig.emailCopy.customerAccountCtaLabel} →
  </a>
  <p style="font-size:12px;color:#94a3b8;text-align:center;margin:-8px 0 16px;">
    ${siteConfig.emailCopy.customerAccountCtaSubtitle}
  </p>
  <p style="font-size:13px;color:#94a3b8;text-align:center;margin-top:16px;">
    No obligation — you're free to accept any quote or none at all.
  </p>
</body>
</html>`,
    text: `Hi ${customerName}, We received your request (${serviceLabels} at ${address}). Contractors will send quotes within 24 hours. Track quotes at: ${appUrl(`/customer/quotes/${leadId}`)} — ${APP_NAME}. Want to save this request? Create an account: ${appUrl(`/customer/setup?email=${encodeURIComponent(to)}&leadId=${leadId}`)}`,
  });
}

/** Notify a customer that a contractor submitted a quote on their lead */
export async function sendQuoteReceivedEmail({
  to,
  customerName,
  leadId,
  serviceTypes,
  contractorName,
}: {
  to: string;
  customerName: string;
  leadId: string;
  serviceTypes: string[];
  contractorName: string;
}) {
  const { name: APP_NAME, emoji } = siteConfig.brand;
  const serviceLabels = serviceTypes
    .map((id) => siteConfig.serviceTypes.find((s) => s.id === id)?.label ?? id)
    .join(", ") || "your job";

  await send({
    to,
    subject: siteConfig.emailCopy.quoteReceivedSubject,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="font-size:28px;margin:0;">${emoji} ${APP_NAME}</h1>
    <p style="color:${siteConfig.theme.primaryDark};font-size:16px;font-weight:600;margin:8px 0 0;">You got a new quote!</p>
  </div>
  <p style="font-size:16px;">Hi ${customerName},</p>
  <p style="font-size:16px;"><strong>${contractorName}</strong> just sent you a quote for your ${serviceLabels} — view &amp; compare it now.</p>
  <a href="${appUrl(`/customer/quotes/${leadId}`)}"
     style="display:block;text-align:center;background:${siteConfig.theme.primary};color:white;text-decoration:none;font-weight:700;
            padding:14px 24px;border-radius:12px;font-size:15px;margin:20px 0;">
    View & Compare Quotes →
  </a>
  <p style="font-size:13px;color:#94a3b8;text-align:center;margin-top:16px;">
    No obligation — you're free to accept any quote or none at all.
  </p>
</body>
</html>`,
    text: `Hi ${customerName}, ${contractorName} just sent you a quote for your ${serviceLabels}. View & compare: ${appUrl(`/customer/quotes/${leadId}`)} — ${APP_NAME}`,
  });
}

/** Notify a contractor that a customer accepted their quote */
export async function sendQuoteAcceptedEmail({
  to,
  contractorName,
  leadId,
  customerName,
  amount,
}: {
  to: string;
  contractorName: string;
  leadId: string;
  customerName: string;
  amount: number;
}) {
  const { name: APP_NAME, emoji } = siteConfig.brand;

  await send({
    to,
    subject: siteConfig.emailCopy.quoteAcceptedSubject,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="font-size:28px;margin:0;">${emoji} ${APP_NAME}</h1>
    <p style="color:${siteConfig.theme.primaryDark};font-size:16px;font-weight:600;margin:8px 0 0;">Quote accepted! 🎉</p>
  </div>
  <p style="font-size:16px;">Hi ${contractorName},</p>
  <p style="font-size:16px;">${customerName} accepted your <strong>$${amount.toLocaleString()}</strong> quote. Reach out to schedule the job.</p>
  <a href="${appUrl("/contractor/dashboard?tab=quotes")}"
     style="display:block;text-align:center;background:${siteConfig.theme.primary};color:white;text-decoration:none;font-weight:700;
            padding:14px 24px;border-radius:12px;font-size:15px;margin:20px 0;">
    View in Dashboard →
  </a>
  <p style="font-size:13px;color:#94a3b8;text-align:center;margin-top:16px;">
    Lead ID: ${leadId.slice(0, 8).toUpperCase()}
  </p>
</body>
</html>`,
    text: `Hi ${contractorName}, ${customerName} accepted your $${amount.toLocaleString()} quote. View it in your dashboard: ${appUrl("/contractor/dashboard?tab=quotes")} — ${APP_NAME}`,
  });
}

/**
 * Notify the site owner of every new lead — unlike the contractor-facing
 * alert (lib/notifications.ts), this one is unmasked: full address, full
 * customer contact, every submitted detail, plus whichever contractors were
 * matched, so Mike can manually follow up (call/text a slow contractor,
 * text the customer, etc). Skips silently if ADMIN_EMAIL isn't set.
 */
export async function sendAdminNewLeadEmail({
  lead,
  customer,
  matchedContractors,
}: {
  lead: Lead;
  customer?: { name?: string | null; phone?: string | null; email?: string | null } | null;
  matchedContractors: { name: string; email: string; phone?: string }[];
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const { name: APP_NAME, emoji } = siteConfig.brand;
  const serviceLabels =
    (lead.service_types ?? [])
      .map((id) => siteConfig.serviceTypes.find((s) => s.id === id)?.label ?? id)
      .join(", ") || "New job";
  const cityLabel = maskAddressToCity(lead.address) || lead.address || "Unknown location";
  const detailsSummary = lead.details ? formatDetailsSummary(lead.details) : [];
  const photos = lead.photo_urls && lead.photo_urls.length > 0 ? lead.photo_urls : lead.photo_url ? [lead.photo_url] : [];

  const photosHtml = photos
    .map((url) => `<img src="${url}" style="width:100px;height:100px;object-fit:cover;border-radius:8px;margin:0 6px 6px 0;">`)
    .join("");
  const detailsHtml = detailsSummary.length
    ? `<ul style="margin:4px 0;padding-left:20px;font-size:13px;color:#374151;">${detailsSummary.map((l) => `<li>${l}</li>`).join("")}</ul>`
    : `<p style="margin:4px 0;font-size:13px;color:#94a3b8;">No additional details submitted.</p>`;
  const contractorsHtml = matchedContractors.length
    ? `<ul style="margin:4px 0;padding-left:20px;font-size:13px;color:#374151;">${matchedContractors
        .map(
          (c) =>
            `<li>${c.name}${c.phone ? ` — <a href="tel:${c.phone}">${c.phone}</a> · <a href="sms:${c.phone}">text</a>` : ""} — <a href="mailto:${c.email}">${c.email}</a></li>`
        )
        .join("")}</ul>`
    : `<p style="margin:4px 0;font-size:13px;color:#94a3b8;">No matching contractors found for this lead.</p>`;

  await send({
    to: adminEmail,
    subject: `${emoji} ${siteConfig.emailCopy.adminNewLeadSubjectPrefix} ${serviceLabels} — ${cityLabel}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1e293b;">
  <h1 style="font-size:22px;margin:0 0 4px;">${emoji} New lead — ${APP_NAME}</h1>
  <p style="font-size:14px;color:#64748b;margin:0 0 20px;">${serviceLabels} · ${lead.address || "No address"}</p>

  ${photos.length ? `<div style="margin-bottom:16px;">${photosHtml}</div>` : ""}

  <h2 style="font-size:14px;margin:16px 0 2px;text-transform:uppercase;letter-spacing:0.03em;color:#64748b;">Customer</h2>
  <p style="font-size:14px;margin:2px 0;">
    ${customer?.name ?? "Unknown"}
    ${customer?.phone ? ` · <a href="tel:${customer.phone}">${customer.phone}</a> · <a href="sms:${customer.phone}">text</a>` : ""}
    ${customer?.email ? ` · <a href="mailto:${customer.email}">${customer.email}</a>` : ""}
  </p>

  <h2 style="font-size:14px;margin:16px 0 2px;text-transform:uppercase;letter-spacing:0.03em;color:#64748b;">Job details</h2>
  ${detailsHtml}

  <h2 style="font-size:14px;margin:16px 0 2px;text-transform:uppercase;letter-spacing:0.03em;color:#64748b;">Matched contractors</h2>
  ${contractorsHtml}

  <a href="${appUrl("/admin")}"
     style="display:inline-block;margin-top:20px;background:${siteConfig.theme.primary};color:white;text-decoration:none;font-weight:700;
            padding:12px 20px;border-radius:10px;font-size:14px;">
    Open Admin →
  </a>
</body>
</html>`,
    text: `New lead: ${serviceLabels} at ${lead.address || "no address"}. Customer: ${customer?.name ?? "Unknown"} ${customer?.phone ?? ""} ${customer?.email ?? ""}. Matched contractors: ${matchedContractors.map((c) => `${c.name} ${c.phone ?? ""} ${c.email}`).join("; ") || "none"}. Admin: ${appUrl("/admin")}`,
  });
}
